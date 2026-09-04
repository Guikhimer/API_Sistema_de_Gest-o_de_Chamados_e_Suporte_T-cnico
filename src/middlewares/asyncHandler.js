/** Encaminha erros de handlers assíncronos ao middleware central. */
module.exports = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
