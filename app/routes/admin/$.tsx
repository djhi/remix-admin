import { Admin, Resource } from "react-admin";
import postgrestRestProvider from "@raphiniert/ra-data-postgrest";
import products from "~/admin/products";
import categories from "~/admin/categories";
import { authProvider } from "~/admin/authProvider";

const dataProvider = postgrestRestProvider("http://localhost:3000/admin/api");

const AdminPage = () => (
  <Admin
    basename="/admin"
    dataProvider={dataProvider}
    authProvider={authProvider}
  >
    <Resource name="product" {...products} />
    <Resource name="category" {...categories} />
  </Admin>
);

export default AdminPage;
