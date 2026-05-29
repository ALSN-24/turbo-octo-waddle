# Retail CRM v3 — AWS Deployment Guide

Two paths covered here: **App Runner** (simplest, no cluster management)
and **ECS Fargate** (more control). Both use RDS MySQL instead of a
containerised database.

---

## Prerequisites

- AWS CLI configured (`aws configure`)
- Docker Desktop installed and running locally
- An AWS account with permissions for ECR, RDS, App Runner / ECS, Secrets Manager

> This project is built for MySQL. It is not compatible with AWS DynamoDB as a drop-in database, and it cannot be deployed as a static site on S3 alone. Use AWS RDS / Aurora MySQL for storage and App Runner / ECS for the server runtime.

---

## Step 1 — Create an RDS MySQL database

```bash
# Example using the AWS CLI (adjust to your VPC / subnet group)
aws rds create-db-instance \
  --db-instance-identifier retail-crm-db \
  --db-instance-class db.t4g.micro \
  --engine mysql \
  --engine-version 8.0 \
  --master-username crm \
  --master-user-password "$(openssl rand -base64 24)" \
  --db-name retail_crm \
  --allocated-storage 20 \
  --no-publicly-accessible
```

After the instance is available, note the endpoint address — you will need it
as `MYSQL_HOST`.

Run the schema migration against your new RDS instance:

```bash
mysql -h <rds-endpoint> -u crm -p retail_crm \
  < scripts/001_create_tables_mysql.sql
```

Create your first admin account:

```bash
MYSQL_HOST=<rds-endpoint> MYSQL_USER=crm MYSQL_PASSWORD=<pwd> \
  MYSQL_DATABASE=retail_crm JWT_SECRET=<secret> \
  npx tsx scripts/create-admin.ts
```

---

## Step 2 — Store secrets in AWS Secrets Manager

Never put credentials in environment variables as plain text in the
App Runner or ECS console. Store them in Secrets Manager:

```bash
# Generate a JWT secret
JWT_SECRET=$(openssl rand -base64 32)

aws secretsmanager create-secret \
  --name retail-crm/jwt-secret \
  --secret-string "$JWT_SECRET"

aws secretsmanager create-secret \
  --name retail-crm/mysql-password \
  --secret-string "your-rds-password"
```

---

## Step 3 — Push the Docker image to ECR

```bash
AWS_REGION=us-east-1          # change to your region
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO=$AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/retail-crm

# Create the ECR repository (once)
aws ecr create-repository --repository-name retail-crm --region $AWS_REGION

# Log in, build, and push
aws ecr get-login-password --region $AWS_REGION \
  | docker login --username AWS --password-stdin $ECR_REPO

docker build -t retail-crm .
docker tag retail-crm:latest $ECR_REPO:latest
docker push $ECR_REPO:latest
```

---

## Option A — Deploy with App Runner (recommended for simplicity)

1. Open the [App Runner console](https://console.aws.amazon.com/apprunner).
2. **Create service** → Source: Container registry → Amazon ECR → select your image.
3. Set **Port** to `3000`.
4. Under **Environment variables**, add plain-text vars:
   ```
   NODE_ENV            production
   NEXT_TELEMETRY_DISABLED  1
   LOG_LEVEL           info
   ALLOW_REGISTRATION  false
   MYSQL_PORT          3306
   MYSQL_HOST          <your-rds-endpoint>
   MYSQL_USER          crm
   MYSQL_DATABASE      retail_crm
   ```
5. Add secrets from Secrets Manager:
   ```
   JWT_SECRET        → ARN of retail-crm/jwt-secret
   MYSQL_PASSWORD    → ARN of retail-crm/mysql-password
   ```
6. **Health check**: path `/api/health`, port 3000 (App Runner uses HTTP
   health checks; the HEALTHCHECK in the Dockerfile is a belt-and-suspenders
   check for the container itself).

> **VPC connector**: if your RDS instance is in a private VPC (recommended),
> attach an App Runner VPC connector so the service can reach the database.
> App Runner → VPC connectors → Create.

---

## Option B — Deploy with ECS Fargate

### Task definition (save as `ecs-task-definition.json`, fill in placeholders)

```json
{
  "family": "retail-crm",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::<ACCOUNT>:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "retail-crm",
      "image": "<ECR_IMAGE_URI>",
      "portMappings": [{ "containerPort": 3000, "protocol": "tcp" }],
      "essential": true,
      "healthCheck": {
        "command": ["CMD-SHELL", "wget -qO- http://localhost:3000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 30
      },
      "environment": [
        { "name": "NODE_ENV",               "value": "production" },
        { "name": "NEXT_TELEMETRY_DISABLED","value": "1" },
        { "name": "LOG_LEVEL",              "value": "info" },
        { "name": "ALLOW_REGISTRATION",     "value": "false" },
        { "name": "MYSQL_PORT",             "value": "3306" },
        { "name": "MYSQL_HOST",             "value": "<RDS_ENDPOINT>" },
        { "name": "MYSQL_USER",             "value": "crm" },
        { "name": "MYSQL_DATABASE",         "value": "retail_crm" }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:<REGION>:<ACCOUNT>:secret:retail-crm/jwt-secret"
        },
        {
          "name": "MYSQL_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:<REGION>:<ACCOUNT>:secret:retail-crm/mysql-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group":         "/ecs/retail-crm",
          "awslogs-region":        "<REGION>",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

```bash
# Register and run
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json

aws ecs create-service \
  --cluster your-cluster \
  --service-name retail-crm \
  --task-definition retail-crm \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```
