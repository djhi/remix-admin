import {
  AutocompleteInput,
  Create,
  Datagrid,
  Edit,
  EditButton,
  List,
  ReferenceField,
  ReferenceInput,
  Show,
  ShowButton,
  SimpleForm,
  SimpleShowLayout,
  TextField,
  TextInput,
} from "react-admin";

const ProductList = () => (
  <List>
    <Datagrid>
      <TextField source="reference" />
      <ReferenceField reference="category" source="category_id">
        <TextField source="name" />
      </ReferenceField>
      <ShowButton />
      <EditButton />
    </Datagrid>
  </List>
);

const ProductShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="name" />
      <ReferenceField reference="categories" source="categoryId">
        <TextField source="name" />
      </ReferenceField>
    </SimpleShowLayout>
  </Show>
);

const ProductCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" />
      <ReferenceInput reference="categories" source="categoryId">
        <AutocompleteInput
          source="name"
          filterToQuery={(query) => ({ "name@ilike": query })}
        />
      </ReferenceInput>
    </SimpleForm>
  </Create>
);

const ProductEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" />
      <ReferenceInput reference="categories" source="categoryId">
        <AutocompleteInput
          source="name"
          filterToQuery={(query) => ({ "name@ilike": query })}
        />
      </ReferenceInput>
    </SimpleForm>
  </Edit>
);

export default {
  list: ProductList,
  show: ProductShow,
  create: ProductCreate,
  edit: ProductEdit,
};
