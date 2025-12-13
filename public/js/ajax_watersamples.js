(function ($) {
    let sampleList = $('#sample-list');
    let errorDiv = $('#error-div');
    let loadMoreBtn = $('#btn-load-more');
    let noMoreMsg = $('#no-more-data');
    let loadingMsg = $('#loading-msg');

    let currentPage = 0;
    let isLoading = false;   //Prevents duplicate concurrent requests

    function showError(msg) {
        errorDiv.text(msg).removeClass('hidden');
    }

    function hideError() {
        errorDiv.text('').addClass('hidden');
    }

    // return text value or 'N/A'
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

    // If no result on first page, show error, on later pages, show "no more data"
    function loadSamples() {
        if (isLoading) return;
        isLoading = true;
        hideError();
        loadingMsg.removeClass('hidden');  // Avoid repeated clicks
        
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

    loadMoreBtn.on('click', function (e) {
        e.preventDefault();
        loadSamples();
    });

    loadSamples();
})(window.jQuery);
