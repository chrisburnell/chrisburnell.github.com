/*!
 * Conditional webmentions for article pages
 * @author Chris Burnell <me@chrisburnell.com>
 */

(() => {
    "use strict";

    const CANONICAL_URL = document.querySelector('link[rel="canonical"]')
        ? document
              .querySelector('link[rel="canonical"]')
              .getAttribute("href")
              .replace("http://localhost:4000", "https://chrisburnell.com")
        : null;
    const WEBMENTIONS_SECTION = document.querySelector(".js-webmentions");
    const WEBMENTIONS_BUTTON = document.querySelector(".js-show-webmentions");
    const WEBMENTIONS_INPUT = document.querySelector(".js-webmentions-input");
    const WEBMENTIONS_SUBMIT = document.querySelector(".js-webmentions-submit");
    const WEBMENTIONS_RESPONSES = document.querySelector(".js-webmentions-responses");
    // `#webmention` will match both `#webmention` and `#webmentions`
    const WEBMENTIONS_HASH = ["#webmention", "#mention", "#response"];
    let webmentionsLoaded = false;
    let responses = {
        like: [],
        repost: [],
        reply: []
    };

    let loadWebmentions = () => {
        fetch(`https://webmention.io/api/mentions?jsonp&target=${CANONICAL_URL}`)
            .then(helpers.checkFetchStatus)
            .then(response => response.json())
            .then(data => {
                if (webmentionsLoaded === false) {
                    // Success!
                    webmentionsLoaded = true;
                    populateResponses(data);
                    let responsesCount = Object.keys(responses)
                        .map(type => {
                            return responses[type].length;
                        })
                        .reduce((p, c) => p + c, 0);
                    if (WEBMENTIONS_BUTTON !== null && responsesCount > 0) {
                        for (let webmentionCount of document.querySelectorAll(".js-webmention-count")) {
                            webmentionCount.innerHTML = `${responsesCount} Response${responsesCount > 1 ? "s" : ""}`;
                        }
                        WEBMENTIONS_RESPONSES.setAttribute("aria-hidden", "false");
                        // prevent hovering the button from continuing to fire
                        WEBMENTIONS_BUTTON.removeEventListener("mouseover", () => {});
                    }
                }
            })
            .catch(error => {
                console.log(`Webmention request status error: ${error.status} ${error.statusText}`);
            });
    };

    let showWebmentions = () => {
        // check if already loaded the webmentions, if not, load it (again)
        if (webmentionsLoaded === false) {
            loadWebmentions();
        }
        // only if the button still exists should we hide the button
        if (WEBMENTIONS_BUTTON !== null && WEBMENTIONS_BUTTON.getAttribute("aria-hidden") === "false") {
            WEBMENTIONS_BUTTON.setAttribute("aria-pressed", "true");
            WEBMENTIONS_BUTTON.setAttribute("aria-expanded", "true");
            WEBMENTIONS_BUTTON.setAttribute("aria-hidden", "true");
            WEBMENTIONS_BUTTON.removeEventListener("click", () => {});
        }
        WEBMENTIONS_SECTION.setAttribute("aria-hidden", "false");
    };

    let checkVisibility = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.intersectionRatio > 0) {
                showWebmentions();
                observer.disconnect();
            }
        });
    };

    ////
    /// Add responses content to Webmention template
    /// @return {String} Populated HTML
    ////
    let populateResponses = data => {
        const WEBMENTIONS_TEMPLATE_DEFAULT = document.querySelector(".webmentions-template-default") ? document.querySelector(".webmentions-template-default").innerHTML.trim() : "";
        const WEBMENTIONS_TEMPLATE_REPLY = document.querySelector(".webmentions-template-reply") ? document.querySelector(".webmentions-template-reply").innerHTML.trim() : "";

        let webmentionsLikeLabel = document.querySelector(".js-webmentions-likes-label");
        let webmentionsLikeContent = document.querySelector(".js-webmentions-likes-content");
        let webmentionsRepostLabel = document.querySelector(".js-webmentions-reposts-label");
        let webmentionsRepostContent = document.querySelector(".js-webmentions-reposts-content");
        let webmentionsReplyLabel = document.querySelector(".js-webmentions-replies-label");
        let webmentionsReplyContent = document.querySelector(".js-webmentions-replies-content");

        for (let link of data.links.reverse()) {
            if (link.verified === true && link.private === false && (link.activity.type === "like" || link.activity.type === "repost" || link.activity.type === "reply")) {
                responses[link.activity.type].push(link);
            }
        }

        if (!!responses.like.length) {
            webmentionsLikeLabel.innerHTML = `${responses.like.length} ${webmentionsLikeLabel.innerHTML}`;
            for (let response of responses.like) {
                if (response !== responses.like[0]) {
                    webmentionsLikeContent.innerHTML += ", ";
                }
                webmentionsLikeContent.innerHTML += processResponses(WEBMENTIONS_TEMPLATE_DEFAULT, response);
            }
            webmentionsLikeLabel.setAttribute("aria-hidden", "false");
            webmentionsLikeContent.setAttribute("aria-hidden", "false");
        }

        if (!!responses.repost.length) {
            webmentionsRepostLabel.innerHTML = `${responses.repost.length} ${webmentionsRepostLabel.innerHTML}`;
            for (let response of responses.repost) {
                if (response !== responses.repost[0]) {
                    webmentionsRepostContent.innerHTML += ", ";
                }
                webmentionsRepostContent.innerHTML += processResponses(WEBMENTIONS_TEMPLATE_DEFAULT, response);
            }
            webmentionsRepostLabel.setAttribute("aria-hidden", "false");
            webmentionsRepostContent.setAttribute("aria-hidden", "false");
        }

        if (!!responses.reply.length) {
            webmentionsReplyLabel.innerHTML = `${responses.reply.length} ${webmentionsReplyLabel.innerHTML}`;
            for (let response of responses.reply) {
                webmentionsReplyContent.innerHTML += processResponses(WEBMENTIONS_TEMPLATE_REPLY, response);
            }
            webmentionsReplyLabel.setAttribute("aria-hidden", "false");
            webmentionsReplyContent.parentNode.setAttribute("aria-hidden", "false");
        }
    };

    ////
    /// Process responses
    /// @return {String} Process HTML
    ////
    let processResponses = (html, response) => {
        // Store some variables we'll check often
        let id = response.id;
        let type = response.activity.type;
        let url = response.data.url;
        let content = response.data.content;
        let date = response.data.published ? response.data.published : response.verified_date;
        let author = response.data.author.name ? response.data.author.name : response.data.name;
        let authorUrl = response.data.author.url.replace(/\/$/, "");

        // ID
        html = helpers.injectContent(html, /{{\s*id\s*}}/, id);

        // TYPE
        html = helpers.injectContent(html, /{{\s*type\s*}}/, type);

        // URL
        html = helpers.injectContent(html, "#", url);

        // CONTENT
        html = helpers.injectContent(html, /{{\s*content\s*}}/, `<q>${content}</q>`);

        // AUTHOR URL
        html = helpers.injectContent(html, /{{\s*author_url\s*}}/, `<a href="${authorUrl}" rel="external">↗</a>`);

        // AUTHOR
        html = helpers.injectContent(html, /{{\s*author\s*}}/, `${author}`);

        // DATE
        html = helpers.injectContent(html, /{{\s*date\s*}}/, `on <time class="webmentions__response__time" datetime="${date}">${helpers.formatDate(new Date(date))}</time>`);

        return html;
    };

    if (WEBMENTIONS_SECTION !== null) {
        let observer = new IntersectionObserver(checkVisibility);
        // initiate Webmentions if hash present on load
        window.addEventListener("load", helpers.actionFromHash(WEBMENTIONS_HASH, showWebmentions));
        // initiate Webmentions if hash present on hash change
        window.addEventListener("hashchange", helpers.actionFromHash(WEBMENTIONS_HASH, showWebmentions));
        // enable the Webmentions button, input, and submit
        helpers.enableElement(WEBMENTIONS_BUTTON, showWebmentions);
        WEBMENTIONS_BUTTON.addEventListener("mouseover", () => {
            if (webmentionsLoaded === false) {
                loadWebmentions();
            }
        });
        helpers.enableElement(WEBMENTIONS_INPUT);
        helpers.enableElement(WEBMENTIONS_SUBMIT);
        // observe the Webmentions button to load in data
        observer.observe(WEBMENTIONS_BUTTON);
    }
})();
