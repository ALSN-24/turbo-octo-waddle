module.exports = [
"[externals]/bcryptjs [external] (bcryptjs, cjs, [project]/node_modules/bcryptjs, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/[externals]_bcryptjs_0-m6k.w._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[externals]/bcryptjs [external] (bcryptjs, cjs, [project]/node_modules/bcryptjs)");
    });
});
}),
"[project]/app/api/auth/register/route.ts [app-route] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.resolve().then(() => {
        return parentImport("[project]/app/api/auth/register/route.ts [app-route] (ecmascript)");
    });
});
}),
];