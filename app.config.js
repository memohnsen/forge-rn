const IS_DEV = process.env.APP_VARIANT === "development";
const APP_GROUP = "group.com.memohnsen.forge.JournalWidget";

export default {
  expo: {
    name: IS_DEV ? "Forge Dev" : "Forge",
    slug: "forge",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/1024.png",
    scheme: "forge",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: false,
      deploymentTarget: 18.0,
      appleTeamId: "HCK9FFW6UX",
      bundleIdentifier: IS_DEV
        ? "com.memohnsen.forge.dev"
        : "com.memohnsen.forge",
      icon: "./assets/images/icon.icon",
      entitlements: {
        "com.apple.security.application-groups": [APP_GROUP],
      },
    },
    android: {
      package: IS_DEV ? "com.memohnsen.forge.dev" : "com.memohnsen.forge",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon.png",
        backgroundImage: "./assets/images/android-icon.png",
        monochromeImage: "./assets/images/android-icon.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      navigationBarColor: "#000000",
    },
    web: {
      output: "static",
      favicon: "./assets/images/logo.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-av",
        {
          microphonePermission: false,
        },
      ],
      "@bacons/apple-targets",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/logo.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "21a35af4-b604-4bcd-a950-0f035cc4a67e",
      },
    },
    owner: "memohnsen",
    updates: {
      url: "https://u.expo.dev/21a35af4-b604-4bcd-a950-0f035cc4a67e",
    },
    runtimeVersion: {
      policy: "appVersion",
    },
  },
};
