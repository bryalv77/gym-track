import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import i18n from '../i18n';
import { captureWebPhoto, isWebCameraAvailable } from './webCamera';

async function toDataUrl(uri: string, width: number, compress: number): Promise<string> {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width, height: Math.round(width * 4 / 3) } }],
    { format: ImageManipulator.SaveFormat.JPEG, compress, base64: true },
  );
  if (manipulated.base64) return `data:image/jpeg;base64,${manipulated.base64}`;
  throw new Error(i18n.t('library.photo.processFailed'));
}

function assetToDataUrl(asset: ImagePicker.ImagePickerAsset): string | null {
  if (asset.base64) return `data:image/jpeg;base64,${asset.base64}`;
  if (asset.uri.startsWith('data:')) return asset.uri;
  return null;
}

/**
 * Opens the photo library, crops to a square and returns a small base64
 * data URL suitable for storing as an avatar in the Realtime Database
 * (~10-20 KB). Returns null when the user cancels.
 */
export async function pickAvatarDataUrl(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error(i18n.t('library.photo.libraryAvatar'));
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  try {
    return await toDataUrl(asset.uri, 240, 0.7);
  } catch (error) {
    console.warn('[photo] resize failed, falling back to raw pick', error);
  }
  const fallback = assetToDataUrl(asset);
  if (fallback) return fallback;
  throw new Error(i18n.t('library.photo.processFailed'));
}

/**
 * Opens the camera or photo library to capture a daily selfie, resizes to
 * a moderate portrait size and returns a base64 data URL suitable for the
 * Realtime Database (~30-80 KB). Returns null when the user cancels.
 */
export async function pickSelfieDataUrl(source: 'camera' | 'library' = 'library'): Promise<string | null> {
  let result: ImagePicker.ImagePickerResult;
  if (source === 'camera' && Platform.OS === 'web' && isWebCameraAvailable()) {
    let dataUrl: string | null;
    try {
      dataUrl = await captureWebPhoto();
    } catch (error) {
      console.warn('[photo] web camera unavailable', error);
      throw new Error(i18n.t('library.photo.camera'));
    }
    if (!dataUrl) return null;
    try {
      return await toDataUrl(dataUrl, 640, 0.6);
    } catch (error) {
      console.warn('[photo] selfie resize failed, using raw capture', error);
      return dataUrl;
    }
  }
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error(i18n.t('library.photo.camera'));
    }
    result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
  } else {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error(i18n.t('library.photo.librarySelfie'));
    }
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
  }
  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  try {
    return await toDataUrl(asset.uri, 640, 0.6);
  } catch (error) {
    console.warn('[photo] selfie resize failed, falling back to raw pick', error);
  }
  const fallback = assetToDataUrl(asset);
  if (fallback) return fallback;
  throw new Error(i18n.t('library.photo.processFailed'));
}
