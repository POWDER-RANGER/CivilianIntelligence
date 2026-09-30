import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/feeds-CAg_Z_8P.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getRegisterFeed_createServerFn_handler = createServerRpc({
	id: "1898f5abcc94bd92f44b28605a49f528ac9067ecf386316eec8e77f83daa241b",
	name: "getRegisterFeed",
	filename: "src/lib/feeds.ts"
}, (opts) => getRegisterFeed.__executeServer(opts));
var getRegisterFeed = createServerFn({ method: "GET" }).handler(getRegisterFeed_createServerFn_handler, async () => {
	try {
		const res = await fetch("https://www.federalregister.gov/api/v1/documents.json?per_page=10&order=newest&fields[]=title&fields[]=html_url&fields[]=publication_date&fields[]=type&fields[]=abstract&fields[]=agencies", { headers: { Accept: "application/json" } });
		if (!res.ok) throw new Error(`register ${res.status}`);
		return {
			ok: true,
			results: (await res.json()).results ?? []
		};
	} catch {
		return {
			ok: false,
			results: []
		};
	}
});
//#endregion
export { getRegisterFeed_createServerFn_handler };
