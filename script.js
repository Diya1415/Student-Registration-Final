// Wait until the page is fully loaded before running anything
$(document).ready(function () {

  // ---- Input helpers: clean the text while the user types ----
  $('#phone').on('input', function () { this.value = this.value.replace(/\D/g, ''); });   // digits only
  $('#usn').on('input', function () { this.value = this.value.toUpperCase().replace(/\s/g, ''); }); // CAPITALS
  $('#email').on('input', function () { this.value = this.value.toLowerCase().replace(/\s/g, ''); });

  // ---- Validation rules: each returns an error message, or '' if the value is fine ----
  var rules = {
    name: function (v) {
      if (!v) return 'Name is required.';
      if (!/^[A-Za-z][A-Za-z .'-]{1,49}$/.test(v)) return 'Name must contain letters only (2 to 50 characters).';
      return '';
    },
    usn: function (v) {
      if (!v) return 'USN is required.';
      if (v.length !== 10) return 'USN must be exactly 10 characters, like 2KE24CS039.';
      // 1 digit + 2 letters + 2 digits + 2 letters + 3 digits  (example: 2KE24CS039)
      if (!/^\d[A-Z]{2}\d{2}[A-Z]{2}\d{3}$/.test(v)) return 'Invalid USN. Use the format 2KE24CS039 (digit, 2 letters, 2 digits, 2 letters, 3 digits).';
      return '';
    },
    email: function (v) {
      if (!v) return 'Gmail address is required.';
      if (!/^[^@\s]+@gmail\.com$/.test(v)) return 'Enter a valid Gmail address ending with @gmail.com.';
      var user = v.split('@')[0];
      // Gmail usernames: 6-30 characters, letters/numbers/dots, no dot at the start/end or two dots together
      if (!/^[a-z0-9.]{6,30}$/.test(user) || /^\.|\.$|\.\./.test(user)) return 'Gmail username must be 6-30 characters (letters, numbers, dots; no dot at the start, end or twice in a row).';
      return '';
    },
    sem: function (v) {
      if (!v) return 'Please select a semester.';
      if (!/^[1-8]$/.test(v)) return 'Semester must be between 1 and 8.';
      return '';
    },
    division: function (v) {
      if (!v) return 'Please select a division.';
      if (['A', 'B', 'C', 'D'].indexOf(v) === -1) return 'Division must be A, B, C or D.';
      return '';
    },
    cgpa: function (v) {
      if (!v) return 'CGPA is required.';
      if (!/^\d{1,2}(\.\d{1,2})?$/.test(v)) return 'CGPA must be a number like 8 or 8.45.';
      if (parseFloat(v) > 10) return 'CGPA cannot be more than 10.';
      return '';
    },
    phone: function (v) {
      if (!v) return 'Phone number is required.';
      if (v.length !== 10) return 'Phone number must be exactly 10 digits.';
      if (!/^[6-9]/.test(v)) return 'Phone number must start with 6, 7, 8 or 9.';
      return '';
    }
  };

  // ---- Show / clear messages ----
  function showError(field, message) {
    $('#' + field).removeClass('valid').addClass('invalid');
    $('#err-' + field).text(message);
  }
  function showOk(field) {
    $('#' + field).removeClass('invalid').addClass('valid');
    $('#err-' + field).text('');
  }
  function clearAll() {
    $('input, select').removeClass('invalid valid');
    $('.error').text('');
    $('#serverError').text('');
  }

  // Read a field's value (trimmed) - USN capitals, Gmail small letters
  function getValue(field) {
    var v = $.trim($('#' + field).val());
    if (field === 'usn') v = v.toUpperCase();
    if (field === 'email') v = v.toLowerCase();
    return v;
  }

  // Check one field; returns true if it is fine
  function checkField(field) {
    var message = rules[field](getValue(field));
    if (message) { showError(field, message); return false; }
    showOk(field);
    return true;
  }

  // ---- Live checking: when the user leaves a field, or changes it after an error ----
  $('#regForm input, #regForm select').on('blur change', function () {
    if (getValue(this.name) !== '') { checkField(this.name); }   // empty boxes are checked on submit
  });
  $('#regForm input').on('input', function () {
    if ($(this).hasClass('invalid')) { checkField(this.name); }  // clears the message as soon as it is fixed
  });

  // ---- Check every field; returns the name of the first wrong field (or '' if all good) ----
  function validateAll() {
    var first = '';
    $.each(rules, function (field) {
      if (!checkField(field) && !first) { first = field; }
    });
    return first;
  }

  // ---- When the form is submitted (button click) ----
  $('#regForm').on('submit', function (e) {
    e.preventDefault();          // stop the normal page reload
    $('#serverError').text('');

    var firstBad = validateAll();
    if (firstBad) {
      $('#serverError').text('Please correct the highlighted fields.');
      $('#' + firstBad).trigger('focus');
      return;                    // stop - nothing is sent until everything is correct
    }

    $('#submitBtn').prop('disabled', true).text('Submitting...');

    // Send the cleaned values to PHP using jQuery AJAX
    $.ajax({
      url: 'submit.php',
      method: 'POST',
      data: {
        name: getValue('name'), usn: getValue('usn'), email: getValue('email'),
        sem: getValue('sem'), division: getValue('division'),
        cgpa: getValue('cgpa'), phone: getValue('phone')
      },
      dataType: 'json'
    })
    .done(function (res) {
      if (res.success) {
        // Fill the result card. .text() is used so nothing can inject HTML.
        $('#r-name').text(res.data.name);
        $('#r-usn').text(res.data.usn);
        $('#r-email').text(res.data.email);
        $('#r-sem').text(res.data.sem);
        $('#r-division').text(res.data.division);
        $('#r-cgpa').text(res.data.cgpa);
        $('#r-phone').text(res.data.phone);
        $('#r-time').text(res.data.time);

        // Hide the form, show the result
        $('#regForm').hide();
        $('#result').removeClass('hidden');
      } else {
        // PHP found a problem - show each message under its field
        var first = '';
        $.each(res.errors, function (field, msg) { showError(field, msg); if (!first) first = field; });
        $('#serverError').text('Please correct the highlighted fields.');
        if (first) { $('#' + first).trigger('focus'); }
      }
    })
    .fail(function () {
      $('#serverError').text('Could not reach the server. Please try again.');
    })
    .always(function () {
      $('#submitBtn').prop('disabled', false).text('Register');
    });
  });

  // ---- Print button: opens the browser print dialog (printer, Save as PDF, paper size, margins...) ----
  $('#printBtn').on('click', function () {
    window.print();
  });

  // Runs every time the print dialog opens (button OR Ctrl+P):
  // fills in the print date and renames the page so "Save as PDF" suggests a good file name
  var oldTitle = document.title;
  window.addEventListener('beforeprint', function () {
    $('#printedOn').text(new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }));
    var name = $('#r-name').text();
    if (name) { document.title = 'Registration - ' + name; }
  });
  window.addEventListener('afterprint', function () {
    document.title = oldTitle;
  });

  // ---- "Register another student" button: reset everything ----
  $('#newBtn').on('click', function () {
    $('#regForm')[0].reset();
    clearAll();
    $('#result').addClass('hidden');
    $('#regForm').show();
  });

});
