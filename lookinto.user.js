// ==UserScript==
// @name         lOOKiNTO
// @namespace    http://github.com/unamed-coder/lOOKiNTO
// @version      1.0.0
// @description  一个简单至极的 Tampermonkey 脚本，方便查看某个洛谷用户的最后活跃时间。以及其他统计信息（尚未实现）。
// @author       unamed-coder
// @match        https://www.luogu.com.cn/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      cdn.jsdelivr.net
// @downloadURL  https://raw.githubusercontent.com/unamed-coder/lOOKiNTO/main/lookinto.user.js
// @updateURL    https://raw.githubusercontent.com/unamed-coder/lOOKiNTO/main/lookinto.user.js
// ==/UserScript==

(async function () {
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
        },
        secTimestampToDate(timestamp) {
            const date = new Date(timestamp * 1000);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },
        secTimestampToTime(secTimestamp) {
            const date = new Date(secTimestamp * 1000);
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
        },
        buildRecordDetailsUrl(recordId) {
            return `${Literal.API_BASE_URL.RECORD_DETAILS}${recordId}`;
        },
        loadHighcharts() {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: Literal.EXTERNAL_CDN_RESOURCES_URL.HIGHCHARTS,
                    onload: function (response) {
                        const script = document.createElement('script');
                        script.textContent = response.responseText;
                        document.head.appendChild(script);

                        if (typeof Highcharts === 'undefined') {
                            reject(new Error('highcharts is undefined after it was loaded'));
                            return;
                        }

                        resolve();
                    },
                    onerror: (err) => reject(new Error('fail to load external resources: highcharts'))
                });
            });
        }
    };

    const Literal = {
        API_BASE_URL: {
            SUBMIT_RECORDS: "https://www.luogu.com.cn/record/list",
            RECORD_DETAILS: "https://www.luogu.com.cn/record/"
        },
        STATUS: {
            ALL: null,
            COMPILE_ERROR: 2,
            ACCEPTED: 12,
            UNACCEPTED: 14
        },
        DIFFICULTY_ID: [1, 2, 3, 4, 5, 6, 7, 8],
        DIFFICULTY: {
            1: "入门",
            2: "普及-",
            3: "普及",
            4: "普及+/提高-",
            5: "提高",
            6: "提高+/省选-",
            7: "省选/NOI−",
            8: "NOI/NOI+/CTS"
        },
        DIFFICULTY_COLOR: {
            1: '#FE4C61',
            2: '#F39C11',
            3: '#FFC116',
            4: '#53C41A',
            5: '#13C2C2',
            6: '#3498DB',
            7: '#9D3DCF',
            8: '#0E1D69'
        },
        SELECTOR: {
            SIDEBAR_CARD_LAST: 'div.l-card:last-child',
            SIDEBAR_CARD_CONTAINTER: '.side',
            USER_INFO_CONTAINER: '.sidebar-container',
            USER_INFO_MAIN: '.sidebar-container > .main',
            USER_INFO_LCARD_LAST: '.sidebar-container > .main > div:last-child'
        },
        EXTERNAL_CDN_RESOURCES_URL: {
            HIGHCHARTS: 'https://cdn.jsdelivr.net/npm/highcharts@13.0.0/highcharts.min.js'
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
                }
                const rawContent = await resp.json();
                if (rawContent.code !== 200) {
                    throw new Error(`fail to fetch submit records: JSON status code returns ${rawContent.code}`);
                }
                return rawContent;
            }
            catch (err) {
                throw new Error(`fail to fetch submit records: ${err}: `);
            }
        },

        get24HourStats(rawContent) {
            const results = rawContent?.currentData?.records?.result;
            const nowSec = Math.floor(Date.now() / 1000);
            const currentHourTs = Math.floor(nowSec / 3600) * 3600;
            const startHourTs = currentHourTs - 23 * 3600;

            const buckets = [];
            for (let i = 0; i < 24; i++) {
                const hourTs = startHourTs + i * 3600;
                const d = new Date(hourTs * 1000);
                const now = new Date(currentHourTs * 1000);
                const isToday = d.getFullYear() === now.getFullYear()
                    && d.getMonth() === now.getMonth()
                    && d.getDate() === now.getDate();

                buckets.push({
                    hourTs,
                    label: `${isToday ? '' : '昨天'} ${String(d.getHours()).padStart(2, '0')}:00`,
                    counts: Array.from({ length: 8 }, () => 0)
                });
            }

            if (!results) return buckets;

            for (const r of results) {
                const t = r.submitTime;
                const d = r.problem?.difficulty;
                if (!t || d < 1 || d > 8) continue;

                const submitHourTs = Math.floor(t / 3600) * 3600;
                if (submitHourTs < startHourTs || submitHourTs > currentHourTs) continue;

                const bucket = buckets.find(b => b.hourTs === submitHourTs);
                if (bucket) bucket.counts[d - 1]++;
            }

            return buckets;
        }
    };

    const Renderer = {
        sidebarCard: {
            getContainer() {
                const containter = document.querySelector(Literal.SELECTOR.SIDEBAR_CARD_CONTAINTER);
                if (!containter) {
                    throw new Error('fail to query sidebar card container element');
                }
                return containter;
            },
        },
        userInfo: {
            getContainer() {
                const containter = document.querySelector(Literal.SELECTOR.USER_INFO_MAIN);
                if (!containter) {
                    throw new Error('fail to query user info container element');
                }
                return containter;
            },


            setDisplay(shown) {
                const container = document.querySelector(Literal.SELECTOR.USER_INFO_MAIN);
                if (!container) {
                    throw new Error('fail to query user info container element');
                }

                if (shown) container.style.display = '';
                else container.style.display = 'none';
            },
        },

        SidebarCard: class {
            constructor(header) {
                this.element = this._createCard(header);
                this.infoRows = [];
            }

            _createCard(header) {
                const srcCard = document.querySelector(Literal.SELECTOR.SIDEBAR_CARD_LAST);
                if (!srcCard) {
                    throw new Error('fail to query sidebar card element');
                }

                const cloneCard = document.createElement(srcCard.tagName);
                for (const attr of srcCard.attributes) {
                    cloneCard.setAttribute(attr.name, attr.value);
                }

                const cardHeader = document.createElement('h3');
                cardHeader.className = 'lfe-h3';
                cardHeader.textContent = header;
                cloneCard.appendChild(cardHeader);

                return cloneCard;
            }

            addInfoRow(name, value, link = null) {
                const infoRow = document.createElement('div');
                infoRow.className = 'l-flex-info-row';

                const nameSpan = document.createElement('span');
                nameSpan.textContent = name;

                const valueDiv = document.createElement('div');
                valueDiv.className = 'right';

                if (link) {
                    const linkA = document.createElement('a');
                    linkA.textContent = value;
                    linkA.href = link;
                    linkA.target = '_blank';
                    linkA.rel = 'noopener noreferrer';
                    valueDiv.appendChild(linkA);
                }
                else {
                    valueDiv.textContent = value;
                }

                infoRow.append(nameSpan, valueDiv);
                this.element.appendChild(infoRow);
                this.infoRows.push({ name, value, link });

                return this;
            }

            appendTo(container) {
                container.appendChild(this.element);
                return this;
            }
        },
        UserInfo: class {
            constructor() {
                this.element = this._createUserInfo();
            }

            _createUserInfo() {
                const srcInfo = document.querySelector(Literal.SELECTOR.USER_INFO_CONTAINER);
                const srcMain = document.querySelector(Literal.SELECTOR.USER_INFO_MAIN);
                if (!srcInfo) {
                    throw new Error('fail to query user info element');
                }
                if (!srcMain) {
                    throw new Error('fail to query user info main element');
                }

                const cloneInfo = document.createElement(srcInfo.tagName);
                const cloneMain = document.createElement(srcMain.tagName);
                for (const attr of srcInfo.attributes) {
                    cloneInfo.setAttribute(attr.name, attr.value);
                }
                for (const attr of srcMain.attributes) {
                    cloneMain.setAttribute(attr.name, attr.value);
                }

                cloneInfo.appendChild(cloneMain);

                return cloneInfo;
            }

            appendTo(container) {
                container.appendChild(this.element);
                return this;
            }
        },
        UserInfoCard: class {
            constructor(header, headerCaption) {
                this.element = this._createUserInfoCard(header, headerCaption);
            }

            _createUserInfoCard(header, headerCaption) {
                const srcLCard = document.querySelector(Literal.SELECTOR.USER_INFO_LCARD_LAST);
                if (!srcLCard) {
                    throw new Error('fail to query user info .l-card element');
                }

                const cloneLCard = document.createElement(srcLCard.tagName);
                for (const attr of srcLCard.attributes) {
                    cloneLCard.setAttribute(attr.name, attr.value);
                }

                const lCardHeader = document.createElement('div');
                lCardHeader.className = 'header';
                lCardHeader.style.display = 'flex';
                lCardHeader.style.justifyContent = 'space-between';
                lCardHeader.style.alignItems = 'center';

                const headerH3 = document.createElement('h3');
                headerH3.className = 'lfe-h3';
                headerH3.textContent = header;
                const captionSpan = document.createElement('span');
                captionSpan.className = 'lfe-caption';
                captionSpan.textContent = headerCaption;

                lCardHeader.appendChild(headerH3);
                lCardHeader.appendChild(captionSpan);
                cloneLCard.appendChild(lCardHeader);

                return cloneLCard;
            }

            appendTo(container) {
                container.appendChild(this.element);
                return this;
            }
        }
    };

    const Panel = {
        applyStyle() {
            GM_addStyle(`
                #lookinto-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 99999;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
            
                #lookinto-panel {
                    width: 80%;
                    height: 100vh;
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    box-sizing: border-box;
                }
                
                #lookinto-panel-title {
                    font-size: 18px;
                    font-weight: bold;
                    color: #333;
                }
                
                #lookinto-panel-btn {
                    background: #1677ff;
                    color: white;
                    border: none;
                    padding: 8px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                }
            `);
        },
        createPanel() {
            const overlay = document.createElement('div');
            const panel = document.createElement('div');
            overlay.id = 'lookinto-overlay';
            panel.id = 'lookinto-panel';

            panel.innerHTML = `
            unimplemented
            <button id="close-panel">close</button>
            `;

            panel.querySelector('#close-panel').addEventListener('click', () => {
                overlay.remove();
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                }
            });

            overlay.appendChild(panel);
            document.body.appendChild(overlay);
        },
        setupKeyBinding() {
            document.addEventListener('keydown', (e) => {
                if (e.shiftKey && e.key === 'P') {
                    e.preventDefault();
                    if (!document.getElementById('lookinto-overlay')) {
                        this.createPanel();
                    }
                }
            });
        }
    };

    async function main() {
        await new Promise(resolve => {
            if (document.readyState === 'complete') {
                resolve();
            }
            else {
                window.addEventListener('load', resolve, { once: true });
            }
        });

        const userHomepagePattern = /^https:\/\/www\.luogu\.com\.cn\/user\/(\d+)$/;
        const matchResult = window.location.href.match(userHomepagePattern);
        if (matchResult) {
            console.log('Matched! now working... ...')

            await Util.loadHighcharts();

            const userId = matchResult[1];
            const rawContent = await DataCollector.getSubmitRecords(userId);

            // last submit info
            {
                const lastSubmitTimestamp = rawContent.currentData.records.result[0].submitTime;
                const recordId = rawContent.currentData.records.result[0].id;
                const dateStr = Util.secTimestampToDate(lastSubmitTimestamp);
                const timeStr = Util.secTimestampToTime(lastSubmitTimestamp);

                new Renderer.SidebarCard('最后一次提交题目')
                    .addInfoRow('日期', dateStr)
                    .addInfoRow('时间', timeStr)
                    .addInfoRow('提交详情', recordId, Util.buildRecordDetailsUrl(recordId))
                    .appendTo(Renderer.sidebarCard.getContainer());
            }

            // recent 24 hours submit info
            {
                const chartCard = new Renderer.UserInfoCard('活动情况', '悬浮指针以查看详情')
                    .appendTo(Renderer.userInfo.getContainer())

                const chartContainer = document.createElement('div');
                chartContainer.id = 'lookinto-chart'
                chartContainer.style.height = '300px';
                chartContainer.style.width = '100%';
                chartCard.element.appendChild(chartContainer);

                const recent24HStats = DataCollector.get24HourStats(rawContent);
                const nowHour = Math.floor(Date.now() / 1000 / 3600);
                const startHour = nowHour - 23;
                const categories = [];
                for (let h = startHour; h <= nowHour; ++h) {
                    const label = `${String(h % 24).padStart(2, '0')}:00`;
                    categories.push(label);
                }
                const series = Literal.DIFFICULTY_ID.map(d => ({
                    name: Literal.DIFFICULTY[d],
                    color: Literal.DIFFICULTY_COLOR[d],
                    data: categories.map(label => recent24HStats[label]?.[d - 1] ?? 0)
                }));

                Highcharts.chart('lookinto-chart', {
                    chart: { type: 'column' },
                    title: { text: '最近 24 小时提交分布' },
                    xAxis: {
                        categories: recent24HStats.map(b => b.label),
                        crosshair: true
                    },
                    yAxis: {
                        min: 0,
                        title: { text: '提交次数' },
                        stackLabels: { enabled: true, format: '{total}' }
                    },
                    tooltip: {
                        useHTML: true,
                        formatter() {
                            return `<b>${this.x}</b><br/>总计：${this.point.stackTotal}<br/>${this.series.name}：${this.point.y}`;
                        }
                    },
                    plotOptions: {
                        column: { stacking: 'normal', borderWidth: 0 }
                    },
                    series: [1, 2, 3, 4, 5, 6, 7, 8].map(d => ({
                        name: Literal.DIFFICULTY[d],
                        color: Literal.DIFFICULTY_COLOR[d],
                        data: recent24HStats.map(b => b.counts[d - 1])
                    }))
                });
            }

            console.log('Injected!');
        }
    }

    main();
})();