import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://192.168.1.120:3000',
  timeout: 10000,
});

export default {
  test() {
    return instance.get('/driver/test');
  },

  login(id: string, pw: string, fcmToken: string) {
    return instance.post('/driver/login', { userId: id, userPw: pw, fcmToken });
  },

  register(id: string, pw: string, fcmToken: string) {
    return instance.post('/driver/register', {
      userId: id,
      userPw: pw,
      fcmToken,
    });
  },

  list(id: string) {
    return instance.post('/driver/list', { userId: id });
  },

  accept(driverId: string, callId: number, call_state: string, userId: string) {
    return instance.post('/driver/accept', {
      driverId: driverId,
      callId: callId,
      call_state: call_state,
      userId: userId,
    });
  },
};
