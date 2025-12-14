(function ($) {
    // Module-scoped variables
    let sampleList, errorDiv, loadMoreBtn, noMoreMsg, loadingMsg;
    let currentPage = 0;
    let isLoading = false;   //Prevents duplicate concurrent requests

    function showError(msg) {
        errorDiv.text(msg).removeClass('hidden');
    }

    function hideError() {
        errorDiv.text('').addClass('hidden');
    }

    function textOrNA(v) {
        if (v === null || v === undefined) return 'N/A';
        return String(v);
    }

    function val(v, unit) {
        if (v === null || v === undefined) return 'N/A';
        if (!unit) return String(v);
        return String(v) + ' ' + unit;
    }

    function apiGet(url) {
        return $.ajax({ method: 'GET', url: url });
    }

    function buildListItem(s) {
        let boroughText = s.borough ? '[' + s.borough + '] ' : '';
        let title = boroughText + textOrNA(s.sample_site) + ' (' + textOrNA(s.date) + ')';

        let li = $('<li></li>').addClass('ws-item');

        let titleSpan = $('<span></span>').addClass('ws-title').text(title);

        let p1 = $('<div></div>').addClass('ws-details').text(
            'Chlorine: ' + val(s.chlorine, 'mg/L') +
            ' | Turbidity: ' + val(s.turbidity, 'NTU') +
            ' | Fluoride: ' + val(s.fluoride, 'mg/L')
        );

        let p2 = $('<div></div>').addClass('ws-details').text(
            'Coliform: ' + val(s.coliform) +
            ' | E.Coli: ' + val(s.ecoli) +
            ' | Sample #: ' + textOrNA(s.sample_number)
        );

        li.append(titleSpan);
        li.append(p1);
        li.append(p2);

        return li;
    }

    function loadSamples() {
        if (isLoading) return;
        isLoading = true;
        hideError();
        loadingMsg.removeClass('hidden');

        loadMoreBtn.addClass('hidden');

        let nextPage = currentPage + 1;
        let url = '/api/water-samples?page=' + nextPage;

        apiGet(url)
            .then(function (data) {
                loadingMsg.addClass('hidden');

                let results = Array.isArray(data) ? data : [];

                if (results.length === 0) {
                    if (currentPage === 0) showError('No water samples found for 2023-2024.');
                    else noMoreMsg.removeClass('hidden');

                    isLoading = false;
                    return;
                }
                results.forEach(function (sample) {
                    sampleList.append(buildListItem(sample));
                });

                currentPage = nextPage;
                loadMoreBtn.removeClass('hidden');
                isLoading = false;
            })
            .catch(function () {
                loadingMsg.addClass('hidden');
                showError('Failed to load data. Please try again later.');
                isLoading = false;
                loadMoreBtn.removeClass('hidden');
            });
    }

    function bindHandlers() {
        // unbind previous handlers to avoid duplicates
        loadMoreBtn.off('click').on('click', function (e) {
            e.preventDefault();
            // if a paginated search is active, skip the default loader behavior
            if (window.WSLoader && window.WSLoader.searchActive) {
                return;
            }
            loadSamples();
        });
    }

    function init() {
        // initialize DOM refs
        sampleList = $('#sample-list');
        errorDiv = $('#error-div');
        loadMoreBtn = $('#btn-load-more');
        noMoreMsg = $('#no-more-data');
        loadingMsg = $('#loading-msg');

        // reset state
        currentPage = 0;
        isLoading = false;

        hideError();
        sampleList.empty();
        noMoreMsg.addClass('hidden');
        loadMoreBtn.addClass('hidden');

        bindHandlers();
        loadSamples();
    }

    function reset() {
        currentPage = 0;
        isLoading = false;
        hideError();
        sampleList.empty();
        noMoreMsg.addClass('hidden');
        loadMoreBtn.addClass('hidden');
        loadSamples();
    }

    window.WSLoader = window.WSLoader || {};
    window.WSLoader.init = init;
    window.WSLoader.reset = reset;
    // helper for other scripts to trigger a non-search load-more
    window.WSLoader.loadMore = function () { loadSamples(); };

    // auto-init on DOM ready
    $(function () {
        if (window.WSLoader && typeof window.WSLoader.init === 'function') window.WSLoader.init();
    });
})(window.jQuery);
