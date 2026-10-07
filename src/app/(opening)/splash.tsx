import { Colors } from "@/constants/colors";
import { useAppFonts } from "@/hooks/useAppFonts";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import { useEffect } from "react";
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    View
} from "react-native";

export default function SplashScreen() {
  const fontsLoaded = useAppFonts();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!fontsLoaded || !authLoaded) {
      return;
    }

    const timer = setTimeout(() => {
      router.replace(
        isSignedIn ? "/dashboard" : "/auth/login",
      );
    }, 1500);

    return () => clearTimeout(timer);
  }, [fontsLoaded, authLoaded, isSignedIn]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../../../assets/images/adlawatt-logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <ActivityIndicator
        size="large"
        color={Colors.light.primary}
        style={styles.loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  logo: {
    width: 300,
    height: 200,
    marginBottom: 5,
  },

  loading: {
    marginTop: 40,
  },
});