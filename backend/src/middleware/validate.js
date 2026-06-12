// Lightweight request-body validation/sanitization.
// Usage: router.post('/', validate({ name: { required: true, max: 100 } }), handler)
// Rules: { required, max (string length), type ('string'|'phone'|'date'|'array'|'object'), enum: [...] }
// Strings are trimmed and control characters stripped in place on req.body.

const PHONE_RE = /^\+91[6-9]\d{9}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function fail(res, message) {
  return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message } });
}

function validate(schema) {
  return (req, res, next) => {
    if (typeof req.body !== 'object' || req.body === null) {
      return fail(res, 'Request body must be a JSON object');
    }

    for (const [field, rules] of Object.entries(schema)) {
      let value = req.body[field];

      if (value === undefined || value === null || value === '') {
        if (rules.required) return fail(res, `${field} is required`);
        continue;
      }

      const type = rules.type || 'string';

      if (type === 'string' || type === 'phone' || type === 'date') {
        if (typeof value !== 'string') return fail(res, `${field} must be a string`);
        // Trim and strip control characters (keeps normal unicode text)
        value = Array.from(value.trim()).filter(c => c.charCodeAt(0) >= 32 && c.charCodeAt(0) !== 127).join('');
        req.body[field] = value;
        if (!value && rules.required) return fail(res, `${field} is required`);
        if (rules.max && value.length > rules.max) return fail(res, `${field} must be at most ${rules.max} characters`);
        if (type === 'phone' && !PHONE_RE.test(value)) return fail(res, `${field} must be a valid Indian mobile number (+91XXXXXXXXXX)`);
        if (type === 'date' && !DATE_RE.test(value)) return fail(res, `${field} must be a date in YYYY-MM-DD format`);
        if (rules.enum && !rules.enum.includes(value)) return fail(res, `${field} must be one of: ${rules.enum.join(', ')}`);
      } else if (type === 'array') {
        if (!Array.isArray(value)) return fail(res, `${field} must be an array`);
        if (rules.max && value.length > rules.max) return fail(res, `${field} must have at most ${rules.max} items`);
      } else if (type === 'object') {
        if (typeof value !== 'object' || Array.isArray(value)) return fail(res, `${field} must be an object`);
      }
    }

    next();
  };
}

module.exports = validate;
