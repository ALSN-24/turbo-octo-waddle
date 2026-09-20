import machine
import time
import ssd1306
import random # Used to simulate shifting GPS coordinates and sleep phases in the web sandbox

# 1. Hardware Initialization
i2c = machine.I2C(0, sda=machine.Pin(4), scl=machine.Pin(5), freq=400000)
display = ssd1306.SSD1306_I2C(128, 64, i2c, addr=0x3c)

# Pin outputs for the physical modules
vib_motor = machine.Pin(15, machine.Pin.OUT)

# 2. System State Configuration (The App Menu System)
# 0: Time, 1: Fitness Tracker, 2: Jump Rope App, 3: GPS Map, 4: Sleep Monitor, 5: SOS Alert
current_app = 0
total_apps = 6

# 3. Persistent Tracking Data Matrix
hours, minutes, seconds = 10, 42, 0
last_tick = time.ticks_ms()

steps = 0
jumps = 0
workout_active = False

latitude = 10.5386    # Base Philippine Coordinates (Bago)
longitude = 122.8412

alarm_hours, alarm_minutes = 10, 43
alarm_tripped = False
sos_active = False

def get_sensor_movement():
    try:
        # Read raw data from the virtual IMU module
        return int(i2c.readfrom_mem(0x68, 0x3B, 1))
    except:
        return 0

print("⚙️ Multi-Tasking Monaco OS Initializing...")

while True:
    current_time = time.ticks_ms()
    
    # SYSTEM CLOCK TICK TICK (Updates background time values constantly)
    if time.ticks_diff(current_time, last_tick) >= 1000:
        seconds += 1
        last_tick = current_time
        
        # Simulate slight variations in GPS walking data and sleep patterns over time
        latitude += random.uniform(-0.0001, 0.0001)
        longitude += random.uniform(-0.0001, 0.0001)
        
        if seconds >= 60: 
            seconds = 0; minutes += 1
            # Check for alarm trigger match
            if hours == alarm_hours and minutes == alarm_minutes:
                alarm_tripped = True
        if minutes >= 60: minutes = 0; hours += 1
        if hours > 12: hours = 1

    # PROCESS RAW PHYSICAL MOTION FOR FITNESS METRICS
    motion_force = get_sensor_movement()
    if motion_force > 150: # Strong intentional movement detected
        steps += 1
        if workout_active:
            jumps += 1 # Increment jump rope calculation loop

    # SCREEN RENDER PIPELINE
    display.fill(0)
    
    # Render Monaco Outer Safety Borders
    display.rect(0, 0, 128, 64, 1)
    display.line(0, 12, 128, 12, 1) # Header separating bar

    # CRITICAL SOS ACCELERATION EVENT MANIPULATION
    if motion_force > 240: # Extreme spike simulating a violent fall impact
        sos_active = True

    if sos_active:
        display.fill(1)
        display.text("!! SOS EMERGENCY !!", 4, 16, 0)
        display.text("SENDING COORDS...", 12, 36, 0)
        vib_motor.value(1) # Fire vibration motor on max
        display.show()
        time.sleep_ms(200)
        continue

    # GLOBAL HARDWARE ALARM INTERRUPT SCREEN
    if alarm_tripped:
        display.text("⏰ ALARM ALER!", 16, 20, 1)
        display.text("WAKE UP GESTURE", 8, 36, 1)
        # Pulse the physical vibration motor disc
        vib_motor.value(1 if seconds % 2 == 0 else 0)
        if motion_force > 180: # Dismiss alarm by flicking wrist sharply
            alarm_tripped = False
            vib_motor.value(0)
        display.show()
        time.sleep_ms(100)
        continue

    # --- APP NAVIGATION LAYOUT RENDERING ---
    
    # APP 0: MAIN TIME CLOCK
    if current_app == 0:
        display.text("MONACO TIME", 4, 2, 1)
        time_str = "{:02d}:{:02d}:{:02d} PM".format(hours, minutes, seconds)
        display.text(time_str, 20, 26, 1)
        display.text("Swipe > Fitness", 4, 50, 1)

    # APP 1: STEP TRACKER
    elif current_app == 1:
        display.text("PEDOMETER STATUS", 4, 2, 1)
        display.text("Steps: {}".format(steps), 12, 24, 1)
        display.text("Goal: 10000", 12, 38, 1)
        display.text("Swipe > JumpRope", 4, 50, 1)

    # APP 2: JUMP ROPE WORKOUT MODE
    elif current_app == 2:
        display.text("JUMP ROPE WORKOUT", 4, 2, 1)
        display.text("Jumps: {}".format(jumps), 12, 20, 1)
        status = "RECORDING" if workout_active else "PAUSED"
        display.text("Status: " + status, 12, 34, 1)
        display.text("Flick to Start/Stop", 4, 50, 1)
        
        # Simulate button tap to toggle recording via extreme slider values
        if motion_force > 200:
            workout_active = not workout_active
            time.sleep_ms(300) # Simple debounce safety buffer

    # APP 3: GPS MAP COORDINATES
    elif current_app == 3:
        display.text("LIVE GPS COORDINATES", 4, 2, 1)
        display.text("LAT: {:.4f}".format(latitude), 8, 20, 1)
        display.text("LON: {:.4f}".format(longitude), 8, 34, 1)
        display.text("Swipe > Sleep App", 4, 50, 1)

    # APP 4: SLEEP STAGE ANALYSIS
    elif current_app == 4:
        display.text("SLEEP GRAPH (MON)", 4, 2, 1)
        # Interpret sleep cycling based on length of physical stillness
        if motion_force == 0:
            stage = "DEEP REM SLEEP"
        elif motion_force < 50:
            stage = "LIGHT SLEEP STATE"
        else:
            stage = "AWAKE / RESTLESS"
        display.text(stage, 4, 28, 1)
        display.text("Swipe > Main Clock", 4, 50, 1)

    # Push layout out to the display pixels
    display.show()
    
    # APPS CYCLE SIMULATOR: Auto-cycles apps every 6 seconds in Wokwi so you can test all screens hands-free
    if seconds % 6 == 0 and seconds != 0:
        current_app = (current_app + 1) % total_apps
        time.sleep_ms(1000) # Stop double trigger skips

    time.sleep_ms(50)
