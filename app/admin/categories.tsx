import {
  Create,
  Datagrid,
  Edit,
  EditButton,
  List,
  Show,
  ShowButton,
  SimpleForm,
  SimpleShowLayout,
  TextField,
  TextInput,
} from "react-admin";

const CategoryList = () => (
  <List>
    <Datagrid>
      <TextField source="name" />
      <ShowButton />
      <EditButton />
    </Datagrid>
  </List>
);

const CategoryCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" />
    </SimpleForm>
  </Create>
);

const CategoryEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" />
    </SimpleForm>
  </Edit>
);

const CategoryShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="name" />
    </SimpleShowLayout>
  </Show>
);

export default {
  list: CategoryList,
  show: CategoryShow,
  create: CategoryCreate,
  edit: CategoryEdit,
};
