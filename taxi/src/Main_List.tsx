import { JSX } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './API';
import messaging from '@react-native-firebase/messaging';

type CallItem = {
  id: number;
  start_addr: string;
  end_addr: string;
  call_state: string;
  formatted_time: string;
};

function Main_List(): JSX.Element {
  console.log('-- Main_List()');

  const [callList, setCallList] = useState<CallItem[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      requestCallList();
    }, []),
  );

  const requestCallList = async () => {
    setLoading(true);
    let userId = (await AsyncStorage.getItem('userId')) || '';

    api
      .list(userId)
      .then(response => {
        let { code, message, data } = response.data[0];
        if (code == 0) {
          setCallList(data);
        } else {
          Alert.alert('오류', message, [
            {
              text: '확인',
              onPress: () => console.log('Cancel Pressed'),
              style: 'cancel',
            },
          ]);
        }
      })
      .catch(err => {
        console.log(JSON.stringify(err));
        setLoading(false);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const Header = () => {
    return (
      <View style={styles.header}>
        <Text style={[styles.headerText, { width: wp(80) }]}>
          출발지 / 도착지
        </Text>
        <Text style={[styles.headerText, { width: wp(20) }]}>상태</Text>
      </View>
    );
  };

  // 인자를 { item } 으로 직접 받도록 수정
  const ListItem = ({ item }: { item: CallItem }) => {
    console.log('item = ' + JSON.stringify(item));

    return (
      <View style={{ flexDirection: 'row', marginBottom: 5, width: wp(100) }}>
        <View style={{ width: wp(80) }}>
          {/* row.start_addr -> item.start_addr 로 수정 */}
          <Text style={styles.textForm}>{item.start_addr}</Text>
          <Text style={[styles.textForm, { borderTopWidth: 0 }]}>
            {/* row.end_addr -> item.end_addr 로 수정 */}
            {item.end_addr}
          </Text>
          <Text style={styles.textForm}>{item.formatted_time}</Text>
        </View>
        <View
          style={{
            width: wp(20),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* row.item.call_state -> item.call_state 로 수정 */}
          <Text>{item.call_state}</Text>
        </View>
      </View>
    );
  };
  
  useEffect(() => {
    const message = messaging().onMessage(async remoteMessage => {
      console.log('[REmote Message]', JSON.stringify(remoteMessage));
      requestCallList();
    });
    return message;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        style={{ flex: 1, width: '100%' }} // width 추가
        data={callList}
        renderItem={ListItem}
        ListHeaderComponent={Header}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={requestCallList} />
        }
      />

      <Modal transparent={true} visible={loading}>
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Icon name="spinner" size={50} color="#3498db" />
          <Text style={{ color: 'black' }}>Loading...</Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // 리스트가 위에서부터 시작하도록 flexbox 정렬 수정
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    height: 50,
    marginBottom: 5,
    backgroundColor: '#3498db',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    textAlign: 'center',
    color: 'white',
  },
  textForm: {
    // flex: 1을 제거하여 내용이 잘리지 않도록 함
    borderWidth: 1,
    borderColor: '#3498db',
    height: hp(5),
    paddingLeft: 10,
    // marginRight: 10, // 부모 View에서 전체 너비를 관리하므로 불필요
    textAlignVertical: 'center', // 텍스트를 세로 중앙에 배치
  },
});

export default Main_List;
