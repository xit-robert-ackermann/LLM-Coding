import { RoleMiddleware } from './role.middleware';
import { Request, Response } from 'express';

function makeReq(rolle?: string, path = '/some-endpoint'): Request & { rolle?: string } {
  return { headers: rolle ? { 'x-rolle': rolle } : {}, path } as any;
}
function makeRes(): { status: jest.Mock; json: jest.Mock; called: boolean } {
  const res: any = { called: false };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('RoleMiddleware', () => {
  const mw = new RoleMiddleware();

  it('calls next() for valid role', () => {
    const next = jest.fn();
    const req = makeReq('mitglied');
    mw.use(req as any, makeRes() as any, next);
    expect(next).toHaveBeenCalled();
    expect((req as any).rolle).toBe('mitglied');
  });

  it('returns 401 for missing header', () => {
    const next = jest.fn();
    const res = makeRes();
    mw.use(makeReq() as any, res as any, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for unknown role', () => {
    const next = jest.fn();
    const res = makeRes();
    mw.use(makeReq('superadmin') as any, res as any, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('skips check for /health path', () => {
    const next = jest.fn();
    const res = makeRes();
    mw.use(makeReq(undefined, '/health') as any, res as any, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
