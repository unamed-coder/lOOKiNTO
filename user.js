// ==UserScript==
// @name         lOOKiNTO
// @namespace    http://tampermonkey.net/
// @version      2026-07-20
// @description  idk
// @author       unamed-coder
// @match        https://www.luogu.com.cn/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const Util = {
        buildUrl(baseUrl, params) {
            const url = new URL(baseUrl);
            Object.entries(params).forEach(([key, value]) => {
                if (value != null) {
                    url.searchParams.set(key, value);
                }
            });
            return url.toString();
        }
    };

    const Literal = {
        API_BASE_URL: {
            SUBMIT_RECORDS: "https://www.luogu.com.cn/record/list"
        },
        STATUS: {
            ALL: null,
            COMPILE_ERROR: 2,
            ACCEPTED: 12,
            UNACCEPTED: 14
        }
    };

    const Logging = {
        warn(content) {
            console.warn(content);
        }
    };

    const DataCollector = {
        async getSubmitRecords(user = null, problemId = null, status = null, page = 1, language = null, orderBy = 0) {
            if (user == null && problemId === null && status === null) {
                Logging.warn("providing no params means fetching the current user's submit records");
            }

            const url = Util.buildUrl(Literal.API_BASE_URL.SUBMIT_RECORDS, {
                user: user,
                problemId: problemId,
                status: status,
                page: 1,
                _contentOnly: 1
            });
            try {
                const resp = await fetch(url);
                if (!resp.ok) {
                    throw new Error(`fail to fetch submit records: HTTP code returns ${resp.status} ${resp.statusText}`);
                    return {};
                }
                const rawContent = await resp.json();
                return rawContent;
            }
            catch (err) {
                throw new Error(`fail to fetch submit records: ${err}: `);
            }
            return {};
        }
    };
})();