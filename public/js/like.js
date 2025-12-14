(function ($) {
  let likeButton = $('#like-button');
  let likeStatus = $('#like-status');

  if (likeButton.length === 0) return;

  function setDisabled(v) {
    likeButton.prop('disabled', !!v);
  }

  function setText(isLiked) {
    likeStatus.text(isLiked ? 'Liked!' : 'Like This Borough');
  }

  function setStyle(isLiked) {
    if (isLiked) {
      likeButton.removeClass('btn-outline-warning').addClass('btn-warning');
    } else {
      likeButton.removeClass('btn-warning').addClass('btn-outline-warning');
    }
  }

  function showError(msg) {
    alert('Error: ' + msg);
  }

  function apiPost(url) {
    return $.ajax({
      method: 'POST',
      url: url,
      contentType: 'application/json'
    });
  }

  function toggleLike() {
    let boroughId = likeButton.data('borough-id');
    if (!boroughId) {
      showError('Missing borough id.');
      return $.Deferred().reject().promise();
    }
    return apiPost(`/boroughs/${boroughId}/like`);
  }

  likeButton.on('click', function (e) {
    e.preventDefault();
    setDisabled(true);

    toggleLike()
      .then(function (response) {
        if (!response || !response.success) return;
        setStyle(!!response.isLiked);
        setText(!!response.isLiked);
      })
      .catch(function (jqXHR) {
        let msg = jqXHR && jqXHR.responseJSON && jqXHR.responseJSON.error
          ? jqXHR.responseJSON.error
          : 'Failed to toggle like.';
        showError(msg);
      })
      .always(function () {
        setDisabled(false);
      });
  });
})(window.jQuery);
