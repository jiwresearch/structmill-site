/* Founder updates signup.
   Posts each form to Buttondown's embed endpoint inside a hidden iframe, so the
   page never reloads (Buttondown asks that this endpoint not be called with fetch).
   The Buttondown username is the form's data-list attribute; no secrets live here. */
(function () {
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var forms = document.querySelectorAll('form[data-updates-form]');
  Array.prototype.forEach.call(forms, function (form, i) {
    var list = form.getAttribute('data-list');
    form.action = 'https://buttondown.com/api/emails/embed-subscribe/' + encodeURIComponent(list);
    form.method = 'post';

    var frame = document.createElement('iframe');
    frame.name = 'updates-frame-' + i;
    frame.title = 'Signup';
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.cssText = 'position:absolute;width:1px;height:1px;border:0;left:-9999px';
    document.body.appendChild(frame);
    form.target = frame.name;

    var email = form.querySelector('input[type=email]');
    var role = form.querySelector('select[data-role]');
    var tag = form.querySelector('input[data-role-tag]');
    var trap = form.querySelector('input[data-trap]');
    var error = form.querySelector('[data-error]');
    var button = form.querySelector('button[type=submit]');
    var waiting = false;

    function done() {
      var status = form.parentNode.querySelector('[data-success]');
      form.hidden = true;
      if (status) { status.hidden = false; status.focus(); }
    }

    frame.addEventListener('load', function () { if (waiting) { waiting = false; done(); } });

    // Invite links: /updates/?invite=1&email=…&name=…&role=lumberyard prefill the
    // first form on the page and tag the signup "invited". The person still clicks the button.
    if (i === 0 && window.URLSearchParams) {
      var q = new URLSearchParams(location.search);
      if (q.has('invite') || q.has('email')) {
        if (q.get('email')) email.value = q.get('email');
        var nameField = form.querySelector('input[name="metadata__first_name"]');
        if (nameField && q.get('name')) nameField.value = q.get('name');
        if (role && q.get('role') && role.querySelector('option[value="' + q.get('role').replace(/[^a-z-]/g, '') + '"]')) role.value = q.get('role');
        var inv = document.createElement('input');
        inv.type = 'hidden'; inv.name = 'tag'; inv.value = 'invited';
        form.appendChild(inv);
      }
    }

    form.addEventListener('submit', function (e) {
      error.textContent = '';
      email.removeAttribute('aria-invalid');
      var value = email.value.trim();
      if (!EMAIL_RE.test(value)) {
        e.preventDefault();
        email.setAttribute('aria-invalid', 'true');
        error.textContent = 'Enter a valid email address.';
        email.focus();
        return;
      }
      email.value = value;
      // Honeypot: people never see this field; bots fill it. Pretend it worked.
      if (trap && trap.value) { e.preventDefault(); done(); return; }
      if (trap) trap.disabled = true;
      // Role becomes a Buttondown tag as well as a custom field.
      if (tag) { tag.value = role && role.value ? role.value : ''; tag.disabled = !tag.value; }
      button.disabled = true;
      button.textContent = 'Sending…';
      waiting = true;
      // If the network is slow, still confirm after a few seconds.
      setTimeout(function () { if (waiting) { waiting = false; done(); } }, 6000);
    });
  });
})();
