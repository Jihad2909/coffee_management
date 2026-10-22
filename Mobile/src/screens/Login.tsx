import {MainLogin} from "@/components/Login/Main";
import { HeaderLogin } from "@/components/Login/Header";
import { Component } from "react";
import { View, Text, StyleSheet } from 'react-native'


export class Login extends Component {
    render(){
        return(
            <View style={{flex:1, backgroundColor:"#F5E6D3",}}>                
                <HeaderLogin  /> 
                <MainLogin />
            </View>
        )        
    }
}

