if (!window.__replenishInjected) {
  window.__replenishInjected = true;

  const BASE =
    "https://getpantry.cloud/apiv1/pantry/97bb90ca-481a-48cd-aafc-e40f9c3073f5";

  const set = async (email, body) =>
    fetch(`${BASE}/basket/${email.toLowerCase()}`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.status === 200);

  const get = async (email) =>
    fetch(`${BASE}/basket/${email.toLowerCase()}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    }).then((r) => (r.status === 200 ? r.json() : null));

  var accessToken, token, refreshToken, email;

  class XhrSpoofing extends XMLHttpRequest {
    // Prefix __, inorder to not override the internal property so, other than signup request can use the native and makes stuff easier.
    __readyState;
    __interceptedUrl;
    __response;
    __responseText;
    __responseType;
    __status;
    __statusText;

    //can still send out underscore prefixed, for those modified request
    get readyState() {
      return this.__readyState ?? super.readyState;
    }

    get response() {
      return this.__response ?? super.response;
    }

    get responseText() {
      return this.__responseText ?? super.responseText;
    }
    get responseType() {
      return this.__responseType ?? super.responseType;
    }
    get status() {
      return this.__status ?? super.status;
    }
    get statusText() {
      return this.__statusText ?? super.statusText;
    }

    constructor() {
      super();
    }

    open(method, url, ...rest) {
      this.__interceptedUrl = url;
      return super.open(method, url, ...rest);
    }

    send(body) {
      if (
        this.__interceptedUrl.includes("auth.api-v1.alfapte.com/domain/login")
      ) {
        const thing = this;
        (async () => {
          try {
            const data = JSON.parse(body);
            email = data.username;
            var account = await get(data.username);
            const checkAccount = async function (account) {
              //checkAccount because if someone login's without tangrine, it would expire the stored token.

              const res = await fetch(
                `https://auth.api-v1.alfapte.com/user/detail`,
                {
                  method: "HEAD",
                  headers: {
                    "Access-Token": account.data.accessToken,
                    Authorization: account.data.token,
                  },
                }
              );
              return res.ok;
            };

            if (!account || !(await checkAccount(account))) {
              const res = await fetch(this.__interceptedUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body,
                credentials: "omit",
              });
              if (res.ok) {
                account = await res.json();
                await set(data.username, account);
              } else {
                thing.__status = res.status;
                thing.__statusText = res.statusText;
                thing.__response = await res.json();
                thing.__responseText = JSON.stringify(thing.response);
                thing.__readyState = 4;
                thing.____responseType = "json";
                thing.onreadystatechange?.();
                thing.onload?.();
                thing.onloadend?.();
                thing.dispatchEvent(new Event("readystatechange"));
                thing.dispatchEvent(new Event("error"));
                thing.dispatchEvent(new Event("loadend"));
                return;
              }
            }
            accessToken = account.data.accessToken;
            token = account.data.token;
            refreshToken = account.data.refreshToken;

            thing.__status = 200;
            thing.__statusText = "OK";
            thing.__readyState = XhrSpoofing.DONE;
            thing.__responseType = "json";
            thing.__responseText = JSON.stringify(account);
            thing.__response = account;

            thing.onreadystatechange?.();
            thing.onload?.();
            thing.onloadend?.();
            thing.dispatchEvent(new Event("readystatechange"));
            thing.dispatchEvent(new Event("load"));
          } catch (err) {
            thing.onerror?.();
            thing.dispatchEvent(new Event("error"));
            console.warn("[XHR Intercept] Error:", err);
          }
        })();
        return;
      } else if (
        this.__interceptedUrl.includes("auth.api-v1.alfapte.com/auth/logout")
      ) {
        window.postMessage("LOGOUT");
        return;
      } else if (
        this.__interceptedUrl.includes("auth.api-v1.alfapte.com/user/timezone")
      ) {
        (async () => {
          if (!token) {
            const pantry = await get("9867529853");
            token = pantry.data.token;
            refreshToken = pantry.data.refreshToken;
          }
          const templateData = {
            isError: false,
            data: {
              token: token,
              refreshToken: refreshToken,
            },
            message: "User timezone set successfully",
          };

          const thing = this;
          thing.__status = 200;
          thing.__statusText = "OK";
          thing.__readyState = XhrSpoofing.DONE;
          thing.__responseType = "json";
          thing.__responseText = JSON.stringify(templateData);
          thing.__response = templateData;

          thing.onreadystatechange?.();
          thing.onload?.();
          thing.onloadend?.();
          thing.dispatchEvent(new Event("readystatechange"));
          thing.dispatchEvent(new Event("load"));
          return;
        })();
      } else {
        return super.send(body);
      }
    }
  }
  window.XMLHttpRequest = XhrSpoofing;
  const originalFetch = window.fetch;

  // Override fetch
  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : input.url;

    if (url.includes("auth.api-v1.alfapte.com/auth/refresh-token")) {
      const response = await originalFetch(input, init);
      const clonedResponse = response.clone();
      const badresponse = {
        isError: true,
        message: "Invalid Token. please try again later!",
      };
      try {
        const newTokens = await clonedResponse.json();
        if (newTokens.isError) return response;
        token = newTokens.data.token;
        refreshToken = newTokens.data.refreshToken;
        const pantryData = await get("9867529853");
        if (!pantryData) {
          alert(
            "[From mosambi 01]: syncing data with database failed. Do not try to login/use in another device, you may get logged out"
          );
          alert("[From mosambi 01]: retrying");
          return new Response(JSON.stringify(badresponse), {
            status: 400,
            statusText: "",
            headers: response.headers,
          });
        }

        pantryData.data.token = newTokens.data.token;
        pantryData.data.refreshToken = newTokens.data.refreshToken;

        const sendPantryData = await set("9867529853", pantryData);
        if (!sendPantryData) {
          alert(
            "[From mosambi 02]: syncing data with database failed. Do not try to login/use in another device, you may get logged out"
          );
          alert("[From mosambi 02]: retrying");
          return new Response(JSON.stringify(badresponse), {
            status: 400,
            statusText: "",
            headers: response.headers,
          });
        }
      } catch (e) {
        console.log(e);
        return response;
      }

      return response;
    }

    // For other URLs
    return originalFetch(input, init);
  };
}
