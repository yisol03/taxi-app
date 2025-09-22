import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://192.168.1.120:3000',
  timeout: 10000,
});

export default {
  test() {
    return instance.get('/taxi/test');
  },

  login(id: string, pw: string, fcmToken: string) {
    return instance.post('/taxi/login', { userId: id, userPw: pw, fcmToken });
  },

  register(id: string, pw: string, fcmToken: string) {
    return instance.post('/taxi/register', {
      userId: id,
      userPw: pw,
      fcmToken,
    });
  },

  list(id: string) {
    return instance.post('/taxi/list', { userId: id });
  },

  callTaxi(callData: any) {
    return instance.post('/taxi/call', callData);
  },
};
