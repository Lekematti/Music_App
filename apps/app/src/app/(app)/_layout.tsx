import { clearToken } from "@/lib/auth";
import { router } from "expo-router";
import { Drawer, DrawerToggleButton } from "expo-router/drawer";
import { ColorValue, Image, Pressable, Text, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

function DrawerIcon({
  source,
  color,
  size,
}: {
  readonly source: number;
  readonly color: ColorValue;
  readonly size: number;
}) {
  return (
    <Image
      source={source}
      style={{
        width: size,
        height: size,
        tintColor: color,
      }}
      resizeMode="contain"
    />
  );
}
type DrawerIconProps = {
  readonly color: ColorValue;
  readonly size: number;
};

const homeIcon = require("../assets/icons/m.png");
const searchIcon = require("../assets/icons/search.png");
const uploadIcon = require("../assets/icons/upload.png");
const profileIcon = require("../assets/icons/profile.png");
const logoIcon = require("../assets/icons/logo.png");
const logoutIcon = require("../assets/icons/logout.png");

function HomeDrawerIcon({ color, size }: DrawerIconProps) {
  return <DrawerIcon source={homeIcon} color={color} size={size} />;
}

function SearchDrawerIcon({ color, size }: DrawerIconProps) {
  return <DrawerIcon source={searchIcon} color={color} size={size} />;
}

function UploadDrawerIcon({ color, size }: DrawerIconProps) {
  return <DrawerIcon source={uploadIcon} color={color} size={size} />;
}

function ProfileDrawerIcon({ color, size }: DrawerIconProps) {
  return <DrawerIcon source={profileIcon} color={color} size={size} />;
}

function HeaderLogo() {
  return (
    <View
      style={{
        marginTop: 12,
        width: 130,
        height: 130,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg
        width="130"
        height="130"
        style={{
          position: "absolute",
        }}
      >
        <Defs>
          <RadialGradient id="logoGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#ffb547" stopOpacity={0.75} />
            <Stop offset="45%" stopColor="#ff7f50" stopOpacity={0.35} />
            <Stop offset="100%" stopColor="#fffc4c" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Rect x="0" y="0" width="130" height="130" fill="url(#logoGlow)" />
      </Svg>

      <Image
        source={logoIcon}
        style={{
          marginTop: 12,
          width: 100,
          height: 100,
        }}
        resizeMode="contain"
      />
    </View>
  );
}

function HeaderMenuButton() {
  return <DrawerToggleButton tintColor="#ffb547" />;
}

function HeaderLogout() {
  return (
    <Pressable
      onPress={() => {
        clearToken();
        router.replace("/(auth)/login");
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginRight: 12,
      }}
    >
      <Text style={{ color: "#ffb547", fontWeight: "700" }}>Logout</Text>
      <Image
        source={logoutIcon}
        style={{
          width: 18,
          height: 18,
          tintColor: "#ffb547",
        }}
        resizeMode="contain"
      />
    </Pressable>
  );
}

export default function AppLayout() {
  return (
    <Drawer
      screenOptions={{
        headerStyle: {
          backgroundColor: "#0b0b0f",
          borderBottomWidth: 0,
          borderBottomColor: "transparent",
          elevation: 0,
          shadowOpacity: 0,
        },
        headerShadowVisible: false,
        headerTintColor: "#ffffff",
        headerTitleAlign: "center",
        headerTitle: HeaderLogo,
        headerLeft: HeaderMenuButton,
        headerRight: HeaderLogout,
        sceneStyle: {
          backgroundColor: "#0b0b0f",
        },
        drawerStyle: {
          backgroundColor: "#12141c",
        },
        drawerActiveTintColor: "#ffb547",
        drawerInactiveTintColor: "#b5b5c0",
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "Home",
          drawerLabel: "Home",
          drawerIcon: HomeDrawerIcon,
        }}
      />

      <Drawer.Screen
        name="search"
        options={{
          title: "Search",
          drawerLabel: "Search",
          drawerIcon: SearchDrawerIcon,
        }}
      />

      <Drawer.Screen
        name="upload"
        options={{
          title: "Upload",
          drawerLabel: "Upload",
          drawerIcon: UploadDrawerIcon,
        }}
      />

      <Drawer.Screen
        name="profile"
        options={{
          title: "Profile",
          drawerLabel: "Profile",
          drawerIcon: ProfileDrawerIcon,
        }}
      />
      <Drawer.Screen
        name="song/[id]"
        options={{
          title: "Song",
          drawerItemStyle: { display: "none" },
        }}
      />
    </Drawer>
  );
}
