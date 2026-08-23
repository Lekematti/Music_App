import { Drawer } from "expo-router/drawer";
import { clearToken } from "@/lib/auth";
import { router } from "expo-router";
import { Pressable, Text } from "react-native";

function LogoutButton() {
  return (
    <Pressable
      onPress={() => {
        clearToken();
        router.replace("/(auth)/login");
      }}
      style={{ marginRight: 14 }}
    >
      <Text style={{ color: "#8cbcff", fontWeight: "700" }}>Logout</Text>
    </Pressable>
  );
}

function HeaderRight() {
  return <LogoutButton />;
}

export default function AppLayout() {
  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: "#0b0b0f" },
        headerTintColor: "#ffffff",
        sceneStyle: { backgroundColor: "#0b0b0f" },
        drawerStyle: { backgroundColor: "#12141c" },
        drawerActiveTintColor: "#8cbcff",
        drawerInactiveTintColor: "#b5b5c0",
        headerRight: HeaderRight,
      }}
    >
      <Drawer.Screen
        name="index"
        options={{ title: "Home", drawerLabel: "Home" }}
      />
      <Drawer.Screen
        name="search"
        options={{ title: "Search", drawerLabel: "Search" }}
      />
      <Drawer.Screen
        name="upload"
        options={{ title: "Upload", drawerLabel: "Upload" }}
      />
      <Drawer.Screen
        name="profile"
        options={{ title: "Profile", drawerLabel: "Profile" }}
      />
      <Drawer.Screen
        name="song/[id]"
        options={{
          title: "Song",
          drawerItemStyle: { display: "none" }, // hide detail page from menu
        }}
      />
    </Drawer>
  );
}
