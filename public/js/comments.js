(function ($) {
  let commentForm = $('#comment-form');
  if (commentForm.length === 0) return;

  let commentTextarea = $('#comment-text');
  let commentList = $('#comment-list');
  let commentErrorDiv = $('#comment-error');

  function getBoroughId() {
    return commentForm.data('borough-id');
  }

  function showError(msg) {
    commentErrorDiv.text(msg).removeClass('hidden');
  }

  function hideError() {
    commentErrorDiv.text('').addClass('hidden');
  }

  function setCount(delta) {
    let h2 = $('#comments-section h2');
    let m = (h2.text() || '').match(/\((\d+)\)/);
    let current = m ? parseInt(m[1], 10) : commentList.children().length;
    h2.text(`Community Feedback (${current + delta})`);
  }

  function textOrNA(v) {
    if (v === null || v === undefined) return 'N/A';
    if (typeof v !== 'string') return String(v);
    let s = v.trim();
    return s.length ? s : 'N/A';
  }

  function formatDate(d) {
    try {
      let dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return 'N/A';
      return dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString();
    } catch {
      return 'N/A';
    }
  }

  function apiPost(url, body) {
    return $.ajax({
      method: 'POST',
      url: url,
      contentType: 'application/json',
      data: JSON.stringify(body || {})
    });
  }

  function submitComment() {
    let boroughId = getBoroughId();
    if (!boroughId) {
      return $.Deferred().reject({ msg: 'Missing borough id.' }).promise();
    }

    let comment = (commentTextarea.val() || '').trim();
    if (!comment || comment.length > 200) {
      return $.Deferred()
        .reject({ msg: 'Comment cannot be empty or exceeds 200 characters.' })
        .promise();
    }

    return apiPost('/comments', { boroughId, comment });
  }

  function buildCommentItem(comment) {
    let name = 'Deleted User';
    if (comment && comment.user) {
      name = (textOrNA(comment.user.fname) + ' ' + textOrNA(comment.user.lname)).trim();
      if (!name) name = 'Deleted User';
    }

    let userNode = comment && comment.user
      ? $('<strong></strong>').text(name)
      : $('<span></span>').addClass('text-danger').text('Deleted User');

    let listItem = $('<li></li>').addClass('list-group-item');

    let commentText = comment ? textOrNA(comment.comment) : 'N/A';
    let commentP = $('<p></p>').text(commentText);

    let when = comment ? formatDate(comment.commentDate) : 'N/A';
    let smallText = $('<small></small>')
      .addClass('text-muted')
      .append('Posted by ')
      .append(userNode)
      .append(' on ' + when);

    listItem.append(commentP).append(smallText);
    return listItem;
  }

  commentForm.on('submit', function (e) {
    e.preventDefault();
    hideError();

    submitComment()
      .then(function (newComment) {
        commentTextarea.val('');
        setCount(1);
        commentList.prepend(buildCommentItem(newComment));
      })
      .catch(function (err) {
        if (err && err.msg) return showError(err.msg);
        let msg =
          err && err.responseJSON && err.responseJSON.error
            ? err.responseJSON.error
            : 'An error occurred while posting comment.';
        showError(msg);
      });
  });

  // About delete feature
  commentList.on('click', '.delete-comment-btn', function (e) {
    e.preventDefault();

    const deleteButton = $(this);
    const commentId = deleteButton.data('comment-id');

    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    $.ajax({
      method: 'DELETE',
      url: `/comments/${commentId}`,
      contentType: 'application/json'
    })
      .done(function () {
        // remove the comment
        deleteButton.closest('li.list-group-item').remove();

        const h2 = $('#comments-section h2');
        const m = (h2.text() || '').match(/\((\d+)\)/);
        let currentCount = m ? parseInt(m[1], 10) : commentList.children().length;
        if (currentCount > 0) {
          h2.text(`Community Feedback (${currentCount - 1})`);
        } else {
          h2.text(`Community Feedback (0)`);
        }

        if (commentList.children().length === 0) {
          $('#comments-section').append('<p class="text-muted mt-3">Be the first to leave a comment!</p>');
        }

      })
      .fail(function (jqXHR) {
        let errorMsg = jqXHR.responseJSON?.error || 'Failed to delete comment.';
        alert('Error deleting comment: ' + errorMsg);
      });
  });
})(window.jQuery);
