import styled from "styled-components";

export const Container = styled.SafeAreaView`
  flex: 1;
  padding: 0px 0px;
`;

export const ContainerHeader = styled.View`
    background-color: #fff;
   height: 180px;
   align-items: center;
   justify-content: center;
`;

export const Barraheader = styled.View`
    background-color: #fdb615;
    height: 10px;
    width: 100%;
`;


export const BoxLogin = styled.View`

align-items: center;
   justify-content: center;
   margin-top: 20px;
`;

export const TextInputLogin = styled.TextInput`
     height: 45px;
    border-width: 1px;
    background-color: #fff;
    border: 1px solid #ccc;
    padding: 15px;
    margin: 10px;
    width: 70%;
`;

export const ButtonLogin = styled.TouchableOpacity`
    width: 70%;
    align-items: center;
    background-color:#007229;
    padding: 10px;
    margin: 10px;
`;

export const ButtonRememberPassword = styled.TouchableOpacity`
    width: 70%;
    align-items: flex-end;
    background-color:transparent;
    margin: 10px;
`;

export const MessageError = styled.Text`
    color:red;
    padding:10px

`
