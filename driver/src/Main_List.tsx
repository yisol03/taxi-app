import { JSX, useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  RefreshControl,
  Modal,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useFocusEffect } from '@react-navigation/native';
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
  userId: string;
};

function Main_List(): JSX.Element {
  console.log('-- Main_List()');

  const [originalCallList, setOriginalCallList] = useState<CallItem[]>([]);
  const [filteredCallList, setFilteredCallList] = useState<CallItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'REQ' | 'RES'>(
    'ALL',
  );

  // FCM foreground 메시지 리스너 설정
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert('새로운 호출', '새로운 호출이 있습니다. 목록을 갱신합니다.');
      requestCallList();
    });

    return unsubscribe;
  }, []);

  // 화면에 포커스가 돌아올 때마다 목록 새로고침
  useFocusEffect(
    useCallback(() => {
      requestCallList();
    }, []),
  );

  const applyFilter = (filter: 'ALL' | 'REQ' | 'RES') => {
    setActiveFilter(filter);
    if (filter === 'ALL') {
      setFilteredCallList(originalCallList);
    } else {
      const filtered = originalCallList.filter(
        call => call.call_state === filter,
      );
      setFilteredCallList(filtered);
    }
  };

  const onAccept = async (item: CallItem) => {
    let driverId = (await AsyncStorage.getItem('userId')) || '';
    api
      .accept(driverId, item.id, 'RES', item.userId)
      .then(response => {
        let { code, message } = response.data[0];
        if (code == 0) {
          requestCallList(); // 성공 시 목록 전체를 다시 불러옵니다.
        } else {
          Alert.alert('오류', message);
        }
      })
      .catch(err => {
        console.log(JSON.stringify(err));
      });
  };

  const requestCallList = async () => {
    setLoading(true);
    let userId = (await AsyncStorage.getItem('userId')) || '';

    api
      .list(userId)
      .then(response => {
        let { code, message, data } = response.data[0];
        if (code == 0) {
          setOriginalCallList(data);
          // 현재 활성화된 필터를 다시 적용합니다.
          if (activeFilter === 'ALL') {
            setFilteredCallList(data);
          } else {
            const filtered = data.filter(
              (call: CallItem) => call.call_state === activeFilter,
            );
            setFilteredCallList(filtered);
          }
        } else {
          Alert.alert('오류', message);
        }
      })
      .catch(err => {
        console.log(JSON.stringify(err));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const Header = () => (
    <View style={styles.header}>
      <Text style={[styles.headerText, { width: wp(80) }]}>
        출발지 / 도착지
      </Text>
      <Text style={[styles.headerText, { width: wp(20) }]}>상태</Text>
    </View>
  );

  const FilterButtons = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          activeFilter === 'ALL' && styles.activeFilter,
        ]}
        onPress={() => applyFilter('ALL')}
      >
        <Text style={styles.filterButtonText}>전체</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.filterButton,
          activeFilter === 'REQ' && styles.activeFilter,
        ]}
        onPress={() => applyFilter('REQ')}
      >
        <Text style={styles.filterButtonText}>REQ</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.filterButton,
          activeFilter === 'RES' && styles.activeFilter,
        ]}
        onPress={() => applyFilter('RES')}
      >
        <Text style={styles.filterButtonText}>RES</Text>
      </TouchableOpacity>
    </View>
  );

  const ListItem = ({ item }: { item: CallItem }) => (
    <View style={{ flexDirection: 'row', marginBottom: 5, width: wp(100) }}>
      <View style={{ width: wp(80) }}>
        <Text style={styles.textForm}>{item.start_addr}</Text>
        <Text style={[styles.textForm, { borderTopWidth: 0 }]}>
          {item.end_addr}
        </Text>
        <Text style={styles.textForm}>{item.formatted_time}</Text>
      </View>
      <View style={styles.statusContainer}>
        {item.call_state === 'REQ' ? (
          <TouchableOpacity
            style={styles.button}
            onPress={() => onAccept(item)}
          >
            <Text style={styles.buttonText}>{item.call_state}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.buttonDisable} disabled={true}>
            <Text style={styles.buttonText}>{item.call_state}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FilterButtons />
      <FlatList
        style={{ flex: 1, width: '100%' }}
        data={filteredCallList}
        renderItem={ListItem}
        ListHeaderComponent={Header}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={requestCallList} />
        }
      />
      <Modal transparent={true} visible={loading}>
        <View style={styles.modalContainer}>
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
  headerText: { fontSize: 18, textAlign: 'center', color: 'white' },
  textForm: {
    borderWidth: 1,
    borderColor: '#3498db',
    height: hp(5),
    paddingLeft: 10,
    textAlignVertical: 'center',
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  buttonDisable: {
    backgroundColor: 'gray',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  buttonText: { color: 'white', fontSize: 16, textAlign: 'center' },
  statusContainer: {
    width: wp(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#f8f8f8',
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  activeFilter: {
    backgroundColor: '#3498db',
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Main_List;
