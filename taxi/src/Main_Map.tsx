import 'react-native-get-random-values';
import { JSX, useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import axios from 'axios';
import api from './API';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
import _ from 'lodash';

type SearchResult = {
  description: string;
  matched_substrings: any[];
  place_id: string;
};

function Main_Map(): JSX.Element {
  console.log('—Main_Map()');

  // 1. State and Ref Declarations
  const mapRef: any = useRef(null);
  const [initialRegion, setInitialRegion] = useState({
    latitude: 37.5666612,
    longitude: 126.9783785,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [marker1, setMarker1] = useState({ latitude: 0, longitude: 0 });
  const [marker2, setMarker2] = useState({ latitude: 0, longitude: 0 });

  const [startSearchText, setStartSearchText] = useState('');
  const [endSearchText, setEndSearchText] = useState('');
  const [startSearchResults, setStartSearchResults] = useState<SearchResult[]>(
    [],
  );
  const [endSearchResults, setEndSearchResults] = useState<SearchResult[]>([]);
  const [activeInput, setActiveInput] = useState<'start' | 'end' | null>(null);

  const [showBtn, setShowBtn] = useState(false);
  const [longPressCoord, setLongPressCoord] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const debouncedFetchResults = useRef(
    _.debounce((text: string, type: 'start' | 'end') => {
      fetchAutocompleteResults(text, type);
    }, 500),
  ).current;

  // 2. API & Business Logic Functions
  const fetchAutocompleteResults = async (
    text: string,
    type: 'start' | 'end',
  ) => {
    if (text.length === 0) {
      if (type === 'start') setStartSearchResults([]);
      else setEndSearchResults([]);
      return;
    }
    const YOUR_API_KEY = 'AIzaSyA_Q9BQTdEAgkEwLP2pR3SlbGMCcPomzkE';
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&key=${YOUR_API_KEY}&language=ko&components=country:kr`;
    try {
      const response = await axios.get(url);
      if (response.data.status === 'OK') {
        if (type === 'start') setStartSearchResults(response.data.predictions);
        else setEndSearchResults(response.data.predictions);
      } else {
        if (type === 'start') setStartSearchResults([]);
        else setEndSearchResults([]);
      }
    } catch (error) {
      console.error('API 요청 실패:', error);
    }
  };

  const getPlaceDetails = async (placeId: string) => {
    const YOUR_API_KEY = 'AIzaSyDIB7GQuhHP5817Ngnf4Wo4J4nAbZh1-4U';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${YOUR_API_KEY}&language=ko`;
    try {
      const response = await axios.get(url);
      if (response.data.status === 'OK') return response.data.result;
    } catch (error) {
      console.error('Place Details API error:', error);
    }
    return null;
  };

  const reverseGeocode = async (coords: {
    latitude: number;
    longitude: number;
  }) => {
    const YOUR_API_KEY = 'AIzaSyDIB7GQuhHP5817Ngnf4Wo4J4nAbZh1-4U';
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${YOUR_API_KEY}&language=ko`;
    try {
      const response = await axios.get(url);
      if (response.data.status === 'OK')
        return response.data.results[0].formatted_address;
    } catch (error) {
      console.error('Reverse Geocode API error:', error);
    }
    return null;
  };

  const onSelectAddr = (data: any, details: any, type: string) => {
    if (details) {
      const { lat, lng } = details.geometry.location;
      if (type === 'start') {
        setMarker1({ latitude: lat, longitude: lng });
        if (marker2.longitude === 0) {
          mapRef.current?.animateToRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.0073,
            longitudeDelta: 0.0064,
          });
        }
      } else {
        setMarker2({ latitude: lat, longitude: lng });
        if (marker1.longitude === 0) {
          mapRef.current?.animateToRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.0073,
            longitudeDelta: 0.0064,
          });
        }
      }
    }
  };

  const handleResultSelection = async (item: SearchResult) => {
    const details = await getPlaceDetails(item.place_id);
    if (!details) return;

    if (activeInput === 'start') {
      setStartSearchText(item.description);
      setStartSearchResults([]);
      onSelectAddr(item, details, 'start');
    } else if (activeInput === 'end') {
      setEndSearchText(item.description);
      setEndSearchResults([]);
      onSelectAddr(item, details, 'end');
    }
    setActiveInput(null);
  };

  const handleLongPress = (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    setLongPressCoord(coordinate);
    setShowBtn(true);
  };

  const handleAddMarker = async (type: 'start' | 'end') => {
    if (!longPressCoord) return;
    const address = await reverseGeocode(longPressCoord);
    if (!address) {
      setShowBtn(false);
      setLongPressCoord(null);
      return;
    }
    if (type === 'start') {
      setMarker1(longPressCoord);
      setStartSearchText(address);
    } else {
      setMarker2(longPressCoord);
      setEndSearchText(address);
    }
    setShowBtn(false);
    setLongPressCoord(null);
  };

  const moveToCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;
        const region = {
          latitude,
          longitude,
          latitudeDelta: 0.0073,
          longitudeDelta: 0.0064,
        };
        mapRef.current?.animateToRegion(region, 1000);
        setMarker1({ latitude, longitude });
        const address = await reverseGeocode({ latitude, longitude });
        if (address) setStartSearchText(address);
      },
      error => console.log(error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const handleCallTaxi = async () => {
    if (startSearchText.trim() === '' || endSearchText.trim() === '') {
      Alert.alert('오류', '출발지와 도착지를 모두 설정해주세요.');
      return;
    }
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      Alert.alert('오류', '로그인 정보가 없습니다.');
      return;
    }
    const callData = {
      userId,
      start_addr: startSearchText,
      start_lat: marker1.latitude,
      start_lng: marker1.longitude,
      end_addr: endSearchText,
      end_lat: marker2.latitude,
      end_lng: marker2.longitude,
    };
    try {
      const response = await api.callTaxi(callData);
      const { code, message } = response.data[0];
      if (code === 0) {
        Alert.alert('성공', '택시 호출이 완료되었습니다.');
      } else {
        Alert.alert('오류', message || '호출에 실패했습니다.');
      }
    } catch (error) {
      console.error('Call taxi error:', error);
      Alert.alert('오류', '호출 요청 중 문제가 발생했습니다.');
    }
  };

  // 3. Effect Hooks
  useEffect(() => {
    return () => debouncedFetchResults.cancel();
  }, [debouncedFetchResults]);

  useEffect(() => {
    if (marker1.latitude !== 0 && marker2.latitude !== 0) {
      mapRef.current?.fitToCoordinates([marker1, marker2], {
        edgePadding: { top: 120, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [marker1, marker2]);

  // 4. Render
  return (
    <SafeAreaView style={styles.container}>
      <MapView
        style={styles.container}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        ref={mapRef}
        onLongPress={handleLongPress}
      >
        <Marker coordinate={marker1} title="출발 위치" />
        <Marker coordinate={marker2} title="도착 위치" pinColor="blue" />
        {marker1.latitude !== 0 && marker2.latitude !== 0 && (
          <Polyline
            coordinates={[marker1, marker2]}
            strokeColor="blue"
            strokeWidth={3}
          />
        )}
      </MapView>

      <View style={styles.viewContainer}>
        <View style={{ position: 'absolute', padding: wp(2) }}>
          {/* Start Address Input */}
          <View style={{ width: wp(75), margin: 3, zIndex: 10 }}>
            <TextInput
              style={styles.input}
              placeholder="출발지 검색"
              value={startSearchText}
              onFocus={() => setActiveInput('start')}
              onChangeText={text => {
                setStartSearchText(text);
                debouncedFetchResults(text, 'start');
              }}
            />
            {activeInput === 'start' && startSearchResults.length > 0 && (
              <View style={styles.resultsContainer}>
                {startSearchResults.map(item => (
                  <TouchableOpacity
                    key={item.place_id}
                    style={styles.resultItem}
                    onPress={() => handleResultSelection(item)}
                  >
                    <Text>{item.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* End Address Input */}
          <View style={{ width: wp(75), margin: 3, zIndex: 9 }}>
            <TextInput
              style={styles.input}
              placeholder="도착지 검색"
              value={endSearchText}
              onFocus={() => setActiveInput('end')}
              onChangeText={text => {
                setEndSearchText(text);
                debouncedFetchResults(text, 'end');
              }}
            />
            {activeInput === 'end' && endSearchResults.length > 0 && (
              <View style={styles.resultsContainer}>
                {endSearchResults.map(item => (
                  <TouchableOpacity
                    key={item.place_id}
                    style={styles.resultItem}
                    onPress={() => handleResultSelection(item)}
                  >
                    <Text>{item.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={handleCallTaxi} style={styles.callButton}>
          <Text style={styles.buttonText}>호출</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.gpsButton}
        onPress={moveToCurrentLocation}
      >
        <Icon name="crosshairs" size={40} color={'#3498db'} />
      </TouchableOpacity>

      {showBtn && (
        <View style={styles.longPressButtonContainer}>
          <TouchableOpacity
            style={[styles.button, { flex: 1, marginVertical: 1 }]}
            onPress={() => handleAddMarker('start')}
          >
            <Text style={styles.buttonText}>출발지로 등록</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { flex: 1, marginVertical: 1 }]}
            onPress={() => handleAddMarker('end')}
          >
            <Text style={styles.buttonText}>도착지로 등록</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  viewContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    padding: 10,
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderWidth: 2,
    borderColor: 'gray',
    marginVertical: 1,
    padding: 10,
    backgroundColor: 'white',
  },
  resultsContainer: {
    position: 'absolute',
    top: 42,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  callButton: {
    position: 'absolute',
    width: wp(18),
    top: wp(2),
    right: wp(2),
    height: 90,
    justifyContent: 'center',
    backgroundColor: '#3498db',
    borderRadius: 5,
  },
  gpsButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  longPressButtonContainer: {
    position: 'absolute',
    top: hp(50) - 45,
    left: wp(50) - 75,
    height: 90,
    width: 150,
  },
});

export default Main_Map;
