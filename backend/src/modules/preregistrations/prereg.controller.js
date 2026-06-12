const preregService = require('./prereg.service');
const supabase = require('../../config/supabase');

async function createPreReg(req, res, next) {
  try {
    const { data: resident } = await supabase
      .from('users')
      .select('id')
      .eq('supabase_auth_id', req.user.id)
      .single();
    const result = await preregService.createPreRegistration(req.body, resident.id);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getForm(req, res, next) {
  try {
    const data = await preregService.getPreRegistrationForm(req.params.token);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function submitForm(req, res, next) {
  try {
    const data = await preregService.submitPreRegistrationForm(req.params.token, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getMyPreRegs(req, res, next) {
  try {
    const { data: resident } = await supabase
      .from('users')
      .select('id')
      .eq('supabase_auth_id', req.user.id)
      .single();
    const data = await preregService.getResidentPreRegistrations(resident.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function cancelPreReg(req, res, next) {
  try {
    const { data: resident } = await supabase
      .from('users')
      .select('id')
      .eq('supabase_auth_id', req.user.id)
      .single();
    const data = await preregService.cancelPreRegistration(req.params.id, resident.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { createPreReg, getForm, submitForm, getMyPreRegs, cancelPreReg };
