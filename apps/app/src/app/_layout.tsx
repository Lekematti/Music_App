import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";
import { PlayerBar, PlayerProvider } from "@/components/player";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <PlayerProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <PlayerBar />
      </PlayerProvider>
    </ThemeProvider>
  );
}
