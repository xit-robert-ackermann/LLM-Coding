import { DomainErrorFilter } from './domain-error.filter';
import { GegenstandNichtVerfuegbarError, MitgliedGesperrtError } from './domain-errors';
import { ArgumentsHost } from '@nestjs/common';

function makeHost(res: any): ArgumentsHost {
  return {
    switchToHttp: () => ({ getResponse: () => res, getRequest: () => ({}) }),
  } as any;
}
function makeRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
}

describe('DomainErrorFilter', () => {
  const filter = new DomainErrorFilter();

  it('maps GegenstandNichtVerfuegbarError to 409', () => {
    const res = makeRes();
    filter.catch(new GegenstandNichtVerfuegbarError('not available'), makeHost(res));
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ fehlercode: 'GEGENSTAND_NICHT_VERFUEGBAR' }));
  });

  it('maps MitgliedGesperrtError to 409', () => {
    const res = makeRes();
    filter.catch(new MitgliedGesperrtError('gesperrt'), makeHost(res));
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ fehlercode: 'MITGLIED_GESPERRT' }));
  });

  it('maps unknown error to 500 without stack trace in response', () => {
    const res = makeRes();
    filter.catch(new Error('boom'), makeHost(res));
    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(body).not.toHaveProperty('stack');
  });
});
