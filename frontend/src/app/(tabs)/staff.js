import React from 'react';
import { Redirect } from 'expo-router';

// The Staff tab is a shortcut into the fullscreen /admin login. Rendering a
// <Redirect> means the tab bar entry simply drops the user on the admin screen
// (which is outside the (tabs) layout so it takes the full viewport).
export default function StaffTab() {
  return <Redirect href="/admin" />;
}
