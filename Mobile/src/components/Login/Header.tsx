import { Component } from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";

export class HeaderLogin extends Component {
  render() {
    return (
      <ImageBackground
        source={require("@/assets/images/backLogin.jpg")}
        style={styles.container}
        imageStyle={styles.image}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Les Deux F</Text>
        </View>
      </ImageBackground>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 4,
    overflow: "hidden",
  },

  image: {
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },

  titleContainer: {
    flex: 1,
    justifyContent: "center",
  },

  title: {
    padding: 10,
    borderRadius: 20,
    marginHorizontal: 10,
    textAlign: "center",
    justifyContent: "center",
    fontSize: 35,
    fontWeight: "bold",
    backgroundColor: "#9A7865",
  },
});
