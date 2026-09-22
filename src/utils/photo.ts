import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Opens the photo library, crops to a square and returns a small base64
 * data URL suitable for storing as an avatar in the Realtime Database
 * (~10-20 KB). Returns null when the user cancels.
 */
export async function pickAvatarDataUrl(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library permission is required to change your picture.');
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
    const manipulated = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 240, height: 240 } }],
      { format: ImageManipulator.SaveFormat.JPEG, compress: 0.7, base64: true },
    );
    if (manipulated.base64) return `data:image/jpeg;base64,${manipulated.base64}`;
  } catch (error) {
    console.warn('[photo] resize failed, falling back to raw pick', error);
  }
  // Web picker already returns base64 when available
  if (asset.base64) return `data:image/jpeg;base64,${asset.base64}`;
  if (asset.uri.startsWith('data:')) return asset.uri;
  throw new Error('Could not process the selected image.');
}
