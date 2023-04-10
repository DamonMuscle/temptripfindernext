/***
 * According to StorageManager.js, localStorage will be the fallback of cookie
 * 
 */


/**
 * The MyTransfinderApiUrl will be updated before release. see MYT-371
 */
const MyTransfinderApiUrl = "https://mytf.transfinder.com/mytfapi/v1";
const DefaultEnterpriseLoginUrl = "https:/login.transfinder.com";
const EnterpriseLoginProductRoutePath = "tripfinder";

/**
 * purpose of this object is ensuring vanity url and seesion
 */
const vanitySessionGuard = {
	productionUrlSuffix: "transfinder.com",
	vendorAccessInfoCache: {},
	parseCookie: function()
	{
		return document.cookie.split(';')
			.map(v => v.split('='))
			.reduce((acc, [key, value]) =>
			{
				if (!key || !value)
				{
					return acc;
				}
				acc[key.trim()] = value.trim();
				return acc;
			}, {});
	},

	/**
	 * This method is reachable only when user accesses website by vanity url.
	 * so we can get the client key from vanity url.
	 * @returns a flag of whether user has a valid session
	 */
	checkAuth: function()
	{
		const cookies = this.parseCookie();

		let clientKey = (cookies["ent.clientKey"] || "").replace(/\"/g, "").trim();
		let token = (cookies["ent.token"] || "").replace(/\"/g, "").trim();

		if (!token && !clientKey)
		{
			clientKey = (localStorage.getItem("ent.clientKey") || "").replace(/\"/g, "").trim();
			token = (localStorage.getItem("ent.token") || "").replace(/\"/g, "").trim();
		}

		if (!clientKey || !token) return Promise.resolve(false);

		if (!this.isDevEnvironment())
		{
			const clientKeyFromUrl = (location.hostname.split(".")[0] || "").trim().toLowerCase();
			if (clientKey !== clientKeyFromUrl) return Promise.resolve(false);
		}

		let baseUrl = "";

		if (APIServer.startsWith(`http:`) || APIServer.startsWith(`https:`))
		{
			baseUrl = APIServer;
		}
		else
		{
			baseUrl = "//" + APIServer.trim().split("/").filter(Boolean).join("/");
		}

		return fetch(`${baseUrl}/v2/${clientKey}/tokens?verify=true&_=${Date.now()}`, {
			method: "GET",
			headers: {
				"Token": token,
				"Content-Type": "application/json;charset=utf-8",
			},
			mode: "cors",
		}).then(response =>
		{
			if (!response.ok)
			{
				return false;
			}

			return response.json().then(({ Items }) =>
			{
				const logged = Items[0] === true;
				localStorage.setItem("ent.isLoggedin", logged);
				return logged;
			});
		});
	},

	generateEnterpriseLoginUri: function()
	{
		const existingUrl = location.origin;
		const myTransfinderUrl = `${MyTransfinderApiUrl}/loginurl?existingurl=${existingUrl}&_=${Date.now()}`;
		return fetch(myTransfinderUrl, {
			method: "GET",
			mode: "cors"
		}).then(response =>
		{
			if (!response.ok)
			{
				return "";
			}

			return response.text();
		}).catch(() =>
		{
			return "";
		}).then(loginUrl =>
		{
			loginUrl = loginUrl || DefaultEnterpriseLoginUrl;

			if (loginUrl.charAt(loginUrl.length - 1) !== "/")
			{
				loginUrl = `${loginUrl}/`;
			}

			const targetInfo = window.location.hash || window.location.search;
			const search = (!targetInfo || targetInfo === "#/") ? "" : `?target=${btoa(targetInfo)}`;
			return `${loginUrl}${EnterpriseLoginProductRoutePath}${search}`;
		});
	},

	parseUrlParam,

	isDevEnvironment: function()
	{
		const { hostname } = location;
		return !hostname.endsWith(this.productionUrlSuffix);
	},

	/**
	 * determine whether we need to redirect vanity url.
	 * @returns
	 * true: redirect to vanity url
	 * false: 1. user is on vanity url (that's our expectation)
	 *        2. development environment(convenient for development)
	 */
	determineRedirect2VanityUrl: function()
	{
		if (this.isDevEnvironment())
		{
			// Stay current page. development environment(convenient for development)
			return Promise.resolve(false);
		}

		return this.getVanityDomain().then(vanityDomain =>
		{
			if (vanityDomain && vanityDomain !== location.hostname)
			{
				// re-enter this page by vanity url after redirecting
				this.redirect(`${location.protocol}//${vanityDomain}${location.pathname}${location.hash || location.search}`);
				return true;
			}

			if (!vanityDomain)
			{
				// re-enter this page by vanity url after passing authentication in Enterprise Login
				this.redirect(this.generateEnterpriseLoginUri());
				return true;
			}

			// Stay current page. vanity url (that's our expectation)
			return false;
		})
	},

	/**
	 * new urls will be {clientKey}.transfinder.com (AKA vanity url)
	 * legacy urls are plus.transfinder.com or serviceplus01.transfinder.com
	 * clientKey in the url has higher priority than in the cookie.
	 * @param {*} fromCookie a flag to determine where to get the potential client key
	 * @returns valid client key
	 */
	getVanityDomain: function(fromCookie = false)
	{
		const { hostname } = location;

		if (this.isDevEnvironment())
		{
			return Promise.resolve("");
		}

		let potentialClientKey;
		if (!fromCookie)
		{
			potentialClientKey = (hostname.split(".")[0] || "").trim().toLowerCase();
		}
		else
		{
			const cookies = this.parseCookie();
			potentialClientKey = (cookies["ent.clientKey"] || "").replace(/\"/g, "").trim().toLowerCase();
		}

		let promise = Promise.resolve(false);
		if (!!potentialClientKey)
		{
			const cachedItem = this.vendorAccessInfoCache[potentialClientKey];
			if (cachedItem !== undefined)
			{
				promise = Promise.resolve(!!cachedItem);
			}
			else
			{
				promise = fetch(`${MyTransfinderApiUrl}/simplevendoraccessinfo?clientid=${potentialClientKey}&_=${Date.now()}`, {
					method: "GET",
					mode: "cors"
				}).then(response =>
				{
					return response.ok;
				}).catch(() =>
				{
					return false;
				});
			}
		}

		return promise.then((result) =>
		{
			if (result)
			{
				return `${potentialClientKey}.${this.productionUrlSuffix}`;
			}

			if (!fromCookie && !result)
			{
				/**
				 * Reaching here means check subdomain from url and failed.
				 * So check subdomain from cookie again.
				 */
				return this.getVanityDomain(true);
			}

			return "";
		});
	},

	/**
	 * @param {*} url promise<string> or string
	 */
	redirect: function(url)
	{
		Promise.resolve(url).then((value) => window.location.href = `${value}`);
	},

	getApiServer: function()
	{
		if (this.isDevEnvironment())
		{
			return;
		}

		const potentialClientKey = (location.hostname.split(".")[0] || "").trim().toLowerCase();
		document.write(`<script src='${MyTransfinderApiUrl}/simplevendoraccessinfo?clientid=${potentialClientKey}&callback=setRoutefinderApiServer&_=${Date.now()}'></script>`);
	},

	setApiServer: function(result)
	{
		if (!result)
		{
			return;
		}

		this.vendorAccessInfoCache[result.ClientId] = result.AccessInfo;
		const apiUrl = result.AccessInfo?.Products?.find(p => p.Name === "RoutefinderApi")?.Uri;
		if (apiUrl)
		{
			window.APIServer = this.removeTrailingSlash(apiUrl);
		}
	},

	removeTrailingSlash: function(url)
	{
		if (url.charAt(url.length - 1) === "/")
		{
			return url.substring(0, url.length - 1);
		}

		return url;
	},
}

function parseUrlParam(url)
{
	var parmResult = {};
	var start = url.indexOf("?") !== -1 ? url.indexOf("?") + 1 : url.length;
	var end = url.length;
	url = url.substring(start, end);
	const parmArray = url.split("&");

	for (var i = 0; i < parmArray.length; i++)
	{
		const parts = parmArray[i].split("=");
		parmResult[parts[0]] = parts[1];
	}

	return parmResult;
}

window.vanitySessionGuard = vanitySessionGuard;
var setRoutefinderApiServer = vanitySessionGuard.setApiServer.bind(vanitySessionGuard);
vanitySessionGuard.getApiServer();
