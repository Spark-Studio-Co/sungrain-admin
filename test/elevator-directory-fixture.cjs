const http = require('node:http');

function fixtures() {
  const services = Array.from({ length: 9 }, (_, i) => ({ id: `service-${i}`, name: `Услуга ${i + 1}`, unit: 'TONNE', culture: null, archived: false, overtimeEligible: false, alternativeGroup: '', rates: [{ id: `rate-${i}`, price: '3000', effectiveFrom: '2026-01-01', createdAt: '2026-01-01' }] }));
  return [
    { id: '00000000-0000-4000-8000-000000000001', name: 'ТОО «Демо Шарбакты»', station: 'Шарбакты', contact: '+7 700 000 00 01', archived: false, services },
    { id: '00000000-0000-4000-8000-000000000002', name: 'ТОО «Демо Павлодар»', station: 'Павлодар-Южный', contact: '+7 700 000 00 02', archived: false, services: [] },
    { id: '00000000-0000-4000-8000-000000000003', name: 'Элеватор «Северный»', station: 'Павлодар-Южный', contact: '', archived: true, services: [] },
  ].map(item => ({ address: '', notes: '', version: 1, ...item }));
}

// Optional local-only preview. All records live in memory and reset on restart.
if (require.main === module) {
  let data = fixtures();
  const server = http.createServer(async (request, response) => {
    const origin = request.headers.origin || '';
    if (/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    response.setHeader('Content-Type', 'application/json');
    const send = (body, status = 200) => { response.statusCode = status; response.end(JSON.stringify(body)); };
    if (request.method === 'OPTIONS') return send({});
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    if (pathname === '/api/user/access') return send({ isAdmin: true, canAccessApproach: true });
    if (pathname === '/api/elevators' && request.method === 'GET') return send(data.filter(item => !item.deletedAt));
    if (pathname === '/api/elevators' && request.method === 'POST') {
      try {
        let body = '';
        for await (const chunk of request) { body += chunk; if (body.length > 10000) return send({ message: 'Request too large' }, 413); }
        const input = JSON.parse(body);
        if (typeof input.name !== 'string' || !input.name.trim()) return send({ message: 'Укажите название' }, 400);
        const item = { ...input, id: require('node:crypto').randomUUID(), version: 1, services: [] };
        data.push(item);
        return send(item, 201);
      } catch { return send({ message: 'Invalid JSON' }, 400); }
    }
    const detail = pathname.match(/^\/api\/elevators\/([^/]+)$/);
    if (detail && ['PATCH','DELETE'].includes(request.method)) {
      try {
        let body = '';
        for await (const chunk of request) { body += chunk; if (body.length > 10000) return send({ message: 'Request too large' }, 413); }
        const input = JSON.parse(body);
        const item = data.find(item => item.id === detail[1]);
        if (!item || (item.deletedAt && request.method !== 'DELETE')) return send({ message: 'Не найден' }, 404);
        if (item.deletedAt) return send({ id: item.id });
        if (input.version !== item.version) return send({ message: 'Карточка изменена. Обновите список.' }, 409);
        if (request.method === 'PATCH') {
          Object.assign(item, input, { id: item.id, version: item.version + 1 });
          return send(item);
        }
        item.deletedAt = new Date().toISOString(); item.archived = true; item.version++;
        return send({ id: item.id });
      } catch { return send({ message: 'Invalid JSON' }, 400); }
    }
    if (detail && request.method === 'GET') {
      const item = data.find(item => item.id === detail[1] && !item.deletedAt);
      return send(item || { message: 'Не найден' }, item ? 200 : 404);
    }
    if (/^\/api\/(station|stations|culture|cultures)/.test(pathname)) return send({ data: [], total: 0, page: 1, limit: 5000 });
    return send({ message: 'Этот локальный preview поддерживает список, карточки и создание элеваторов.' }, 501);
  });
  server.listen(3036, '127.0.0.1', () => console.log('Synthetic elevators API: http://127.0.0.1:3036/api'));
}
module.exports = { fixtures };
