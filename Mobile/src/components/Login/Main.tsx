import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ImageBackground,
} from "react-native";

export function MainLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connecter !</Text>

      <View style={styles.containerInput}>
        <TextInput
          style={styles.input}
          placeholder="Tapez votre email..."
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Tapez votre mot de passe..."
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Connecter</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.forgotContainer}>
        <Text style={styles.forgot}>Mot de passe oublié ?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 6,
    backgroundColor: "#9A7865",

    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,

    marginTop: -35,

    paddingHorizontal: 25,
    paddingTop: 35,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 30,
  },

  containerInput: {
    marginTop: 10,
  },

  input: {
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },

  button: {
    backgroundColor: "#6F421C",
    borderRadius: 30,
    paddingVertical: 15,
    width: "60%",
    alignSelf: "center",
    marginTop: 20,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
  },

  forgotContainer: {
    marginTop: 20,
    alignItems: "center",
  },

  forgot: {
    color: "#fff",
    fontSize: 15,
  },
});