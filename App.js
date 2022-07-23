import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Image, LogBox, Modal, StyleSheet, Text, View } from "react-native";
import WebView from "react-native-webview";
import { Barraheader, BoxLogin, ButtonLogin, ButtonRememberPassword, Container, ContainerHeader, MessageError, TextInputLogin } from "./styles";

// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

export default function App() {
  //Métodos e as variáveis
  // const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  // const [isAuthenticated, setIsAuthenticated] = useState(null);
  // const [expoPushToken, setExpoPushToken] = useState("");
  // const [notification, setNotification] = useState(false);
  // const [tokenData, setToken] = useState("");
  // const { width } = useWindowDimensions();
  // const [openModalActive, setOpenModalActive] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();
  

  const [email, onChangeEmail] = useState("");
  const [password, onChangePassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [openLink, setOpenLink] = useState(false);
  
  
  const [urlActive, setUrlActive] = useState("");
  const urlPath = "https://www.logincanalcondominio.com.br/";
  

  LogBox.ignoreAllLogs();

  async function handleLogin() {

    setErrorMessage("");
    await eraseData();

    if (email == "" || password == "") {
      setErrorMessage("Por favor informe o Login/Senha.");
      return false;
    }

    new Promise(function (resolve, reject) {

      var xhttp = new XMLHttpRequest();
      xhttp.open("POST", `${urlPath}loginm.asp`, true);
      xhttp.setRequestHeader(
        "Content-type",
        "application/x-www-form-urlencoded"
      );
      xhttp.send(`txt1a=S&txtemail=${email}&txt_senha=${password}&txtversao=2`); //+"&id_mobile='"+id_mobile

      xhttp.onreadystatechange = async function () {
        if (this.readyState == 4 && this.status == 200) {

          
          var data = this.response;

          console.log("LOGIN: ", data);
          if (!data) {
            setErrorMessage("Dados incorretos.");
            reject("Dados incorretos: " + data);
            return false;
          }

          if (data) data = JSON.parse(data);

          if (data.send_url != undefined) {
            //create data localStorage
            await saveData("@authenticate", {
              id: data.send_url,
              token: data.token,
            });

            //Save token on userAccount DB
            await handleSaveIdPush(data);

            //Check if User accept FaceId/Biometry
            await onAuthenticateBiometry(data);

            resolve("sucess: ");
          }

          if (data.send_url == "") {
            setErrorMessage("Houve uma falha. Informe o suporte. ");
            reject("Status: " + xhttp.status);
          } else if (data.erro || !data.send_url) {
            setErrorMessage(data.erro);
            reject("Erro: " + JSON.stringify(data));
          }
        }
      };

      return false;
    }).catch(function (error) {
      console.log(error);
    });
  }

  async function handleSaveIdPush(data) {
    const savedToken = await getSavedData("@savedToken");
    
    console.log("savedToken", savedToken);
    
    if (savedToken.length > 0) {
      await fetch(
        `${urlPath}loginm.asp?txt1a=S&token=${data.token}&id_mobile=${savedToken[0].id}&txtversao=2`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
    }
  }

  // useEffect(async () => {
  //   const acceptBiometry = await getSavedData("@acceptBiometry");
  //   console.log("acceptBiometry", acceptBiometry);
  //   if (acceptBiometry.length > 0) {
  //     await onAuthenticateBiometry();
  //   }
  // }, []);

  // useEffect(() => {
  //   registerForPushNotificationsAsync().then((token) =>
  //     setExpoPushToken(token)
  //   );

  //   notificationListener.current =
  //     Notifications.addNotificationReceivedListener((notification) => {
  //       setNotification(notification);
  //     });

  //   responseListener.current =
  //     Notifications.addNotificationResponseReceivedListener((response) => {
  //       //alert("response" + response);
  //     });

  //   return () => {
  //     Notifications.removeNotificationSubscription(
  //       notificationListener.current
  //     );
  //     Notifications.removeNotificationSubscription(responseListener.current);
  //   };
  // }, []);

  async function registerForPushNotificationsAsync() {
    let token;
    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        //alert('Failed to get push token for push notification!');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
      if (token) {
        //alert("token" + token);
        setToken(token);
        saveData("@savedToken", { id: token });
        //await checkIsFavorite(token);
        //await sendMessage(token)
      }
    } else {
      //alert('Must use physical device for Push Notifications');
    }

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#ffffff",
      });
    }

    return token;
  }

  // Check if hardware supports biometrics
  // useEffect(() => {
  //   (async () => {
  //     const compatible = await LocalAuthentication.hasHardwareAsync();
  //     // alert('compatible', compatible)
  //     setIsBiometricSupported(compatible);
  //   })();
  // });

  //

  async function onAuthenticateBiometry() {
    const data = await getSavedData("@authenticate");
    const acceptBiometry = await getSavedData("@acceptBiometry");

    console.log("data", data);
    console.log("acceptBiometry", acceptBiometry);

    if (acceptBiometry.length === 0) {
      const auth = LocalAuthentication.authenticateAsync({
        promptMessage: "Autenticação",
        fallbackLabel: "Valide para acesso mais rápido.",
      });
      auth.then(async (result) => {
        setIsAuthenticated(result.success);

        await saveDataSingle("@acceptBiometry", `${result.success}`);
        await setUrlActive(data[0].id);
        setOpenLink(true);

        console.log("Result: ", result);
      });
    } else {
      if (acceptBiometry === "true") {
        const auth = LocalAuthentication.authenticateAsync({
          promptMessage: "Autenticação",
          fallbackLabel: "Valide para acesso mais rápido.",
        });
        auth.then((result) => {
          setIsAuthenticated(result.success);
          if (result.success) {
            setUrlActive(data[0].id);
            setOpenLink(true);
          } else {
            setErrorMessage("Autenticação inválida.");
          }

          console.log("Result: ", result);
        });
      } else {
        setUrlActive(data[0].id);
        setOpenLink(true);
      }
    }
  }

  async function handleReceivedMessage() {
    onChangeEmail("");
    onChangePassword("");
    await eraseData();
  }

  async function eraseData() {
    await deleteAllData("@acceptBiometry");
    await deleteAllData("@isOpenPage");
    await deleteAllData("@authenticate");
    await setUrlActive("");
    await setOpenLink(false);
  }
  async function setUrlPage(url) {
    await setUrlActive(`${urlPath}${url}`);
    setOpenLink(true);
  }

  return (
    <>
      <Container>
        <ContainerHeader>
          <Image
            source={require("./assets/icon.png")}
            style={{ width: 250, height: 120 }}
          />
        </ContainerHeader>
        <Barraheader />

        <BoxLogin>
          <TextInputLogin
            onChangeText={onChangeEmail}
            value={email}
            placeholder="Login"
          />
          <TextInputLogin
            onChangeText={onChangePassword}
            value={password}
            placeholder="Senha"
            secureTextEntry={true}
          />

          <ButtonRememberPassword
            onPress={() => setUrlPage("esqueci_senham.asp?txtversao=2")}
          >
            <Text>Esqueci minha senha</Text>
          </ButtonRememberPassword>

          <ButtonLogin onPress={handleLogin}>
            <Text style={{ color: "#FFF" }}>ENTRAR</Text>
          </ButtonLogin>

          {!!errorMessage && errorMessage != "" && (
            <MessageError>{errorMessage}</MessageError>
          )}

          <Text>v. 4.0</Text>
        </BoxLogin>
        
         <Modal animationType="slide" transparent={false} visible={openLink}>
          <WebView
            source={{ uri: urlActive }}
            //Enable Javascript support
            //For the Cache
            domStorageEnabled={true}
            originWhitelist={["*"]}
            allowsInlineMediaPlayback
            javaScriptEnabled
            scalesPageToFit
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabledAndroid
            useWebkit
            startInLoadingState={true}
            onMessage={(event) => {
              handleReceivedMessage(event);
            }}
            incognito={true}
          />
        </Modal>
        
      </Container>
    </>
  );
}
