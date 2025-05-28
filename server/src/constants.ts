import { AdminUser } from "./types";

export const COLUMNS = [{
  id: "new",
  title: "חדשים"
},
{
  id: "MergedWithPending",
  title: 'צומד ל-"מתין להגשה"'
},
{
  id: "punishmentComing",
  title: "עונש בהורדה"
},
{
  id: "punishmentRunning",
  title: "עונש בריצה"
},
{
  id: "history",
  title: "היסטוריה"
}
];

export const ADMIN_USER: AdminUser = {
  username: 'admin',
  password: 'admin123'
};