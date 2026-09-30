import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/feeds-C7m1TAcU.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getRegisterFeed = createServerFn({ method: "GET" }).handler(createSsrRpc("1898f5abcc94bd92f44b28605a49f528ac9067ecf386316eec8e77f83daa241b"));
//#endregion
export { getRegisterFeed as t };
