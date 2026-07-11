import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function SongScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View>
      <Text>Song {id}</Text>
    </View>
  );
}
