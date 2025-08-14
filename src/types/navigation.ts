import { Coach, Conversation } from './index';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  CoachDetail: {
    coach: Coach;
  };
  MySessions: undefined;
  Messages: undefined;
  Chat: {
    conversation: Conversation;
  };
  UserProfile: undefined;
  CoachVerification: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  CoachDetail: {
    coach: Coach;
  };
  MySessions: undefined;
  Messages: undefined;
  Chat: {
    conversation: Conversation;
  };
  UserProfile: undefined;
  CoachVerification: undefined;
};