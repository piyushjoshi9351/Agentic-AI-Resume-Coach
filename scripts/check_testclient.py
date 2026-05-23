import sys
try:
    import fastapi, starlette, httpx
    from fastapi.testclient import TestClient
    from fastapi import FastAPI
    print('fastapi', fastapi.__version__)
    print('starlette', starlette.__version__)
    print('httpx', httpx.__version__)
    app = FastAPI()
    @app.get('/')
    def root():
        return {'ok': True}
    tc = TestClient(app)
    r = tc.get('/')
    print('testclient status', r.status_code, r.json())
except Exception as e:
    print('error', e)
    import traceback
    traceback.print_exc()
    sys.exit(1)
