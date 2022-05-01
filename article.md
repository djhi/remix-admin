# Adding React Admin To Remix With Supabase

## Setup

Create a new Remix project:

```sh
npx create-remix@latest
```

Options:

- the name you want: remix-admin
- Just the basics
- Remix App Server
- TypeScript
- Don't run npm install

```
cd remix-admin
```

And let's install react-admin:

```sh
yarn add react-admin
```

## Adding React Admin To Remix

Now, we're going to add a Remix Route for our admin. However, we won't be adding a Remix Route for each page as react-admin already handle that. We do want to leverage the Remix Router though. Fortunately, React Admin v4 will detect that it is already inside a React Router and won't create another one.

I created an `admin` directory in the `app/routes` directory already provided by Remix. It contains only one file named `$.tsx`. The `$` name means it is a [splat route](https://remix.run/docs/en/v1/api/conventions#splat-routes), a route that catch all sub routes (for instance, it will catch `/admin/products/1`).

```tsx
// In app/routes/admin/$.tsx
import { Admin } from "react-admin";

const AdminPage = () => <Admin basename="/admin" />;

export default AdminPage;
```

We can't test it works by running `yarn dev` and open the admin url: http://localhost:3000/admin.

## Adding Supabase

First, I created a Supabase instance and added the two following tables:

- Products (`id`, `name`, `categoryId`)
- Categories (`id`, `name`)

Then, I installed the Supabase client library:

```sh
yarn add @supabase/supabase-js
```

We also need a data provider for React Admin. As Supabase provides a Postgrest endpoint, I'll use [`ra-data-postgrest`](https://github.com/raphiniert-com/ra-data-postgrest):

```sh
yarn add @raphiniert/ra-data-postgrest
```

The Postgrest endpoint URL is the Supabase instance URL at the path `rest/v1` (`https://YOUR_INSTANCE.supabase.co/rest/v1` for instance). However, it needs the public anonymous key or the service role key to access it and I don't want it to be available on the client.

Instead, I'll add a Remix Route that will act as a proxy, leveraging the splat route mechanism again, in `app/routes/admin/api`.

First, I need to make the Supabase variables available to Remix. As it supports `dotenv` by default in `development` mode, I can just create an `.env` file:

```sh
# In `.env`
SUPABASE_URL="https://MY_INSTANCE.supabase.co"
SUPABASE_SERVICE_ROLE="MY_SERVICE_ROLE_KEY"
```

Note that I used the service role key here and not the anonymous to allow write operations without dealing with authorization. I'll explore authorization in another article.

Then I added a Remix Route that provide a `loader` function. This is the function called for `GET` requests. The API loader will convert the URL it was called with into a Supabase Postgrest URL and call the Postrest endpoint.

```tsx
// In app/routes/admin/api/$.tsx
import { LoaderFunction } from "@remix-run/node";

export const loader: LoaderFunction = ({ request }) => {
  const apiUrl = getSupabaseUrlFromRequestUrl(request.url);

  return fetch(apiUrl, {
    headers: {
      apiKey: `${process.env.SUPABASE_SERVICE_ROLE}`,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`,
    },
  });
};

const ADMIN_PREFIX = "/admin/api";

const getSupabaseUrlFromRequestUrl = (url: string) => {
  const startOfRequest = url.indexOf(ADMIN_PREFIX);
  const query = url.substring(startOfRequest + ADMIN_PREFIX.length);
  return `${process.env.SUPABASE_URL}/rest/v1${query}`;
};
```

Finally, I added the React Admin Resources and configured the dataProvider:

```tsx
import {
  Admin,
  Datagrid,
  List,
  ReferenceField,
  Resource,
  TextField,
} from "react-admin";
import postgrestRestProvider from "@raphiniert/ra-data-postgrest";

const dataProvider = postgrestRestProvider("http://localhost:3000/admin/api");

const AdminPage = () => (
  <Admin basename="/admin" dataProvider={dataProvider}>
    <Resource name="products" list={<ProductList />} />
    <Resource name="categories" list={<CategoryList />} />
  </Admin>
);

const ProductList = () => (
  <List>
    <Datagrid>
      <TextField source="name" />
      <ReferenceField reference="categories" source="categoryId">
        <TextField source="name" />
      </ReferenceField>
    </Datagrid>
  </List>
);

const CategoryList = () => (
  <List>
    <Datagrid>
      <TextField source="name" />
    </Datagrid>
  </List>
);

export default AdminPage;
```

And voila! We're done! Are we? There is actually an issue we can't see yet as I didn't add an `edit` view nor a `show` view. Let's add a `show` view:

```diff
import {
  Admin,
  Datagrid,
  List,
  ReferenceField,
  Resource,
  TextField,
} from "react-admin";
import postgrestRestProvider from "@raphiniert/ra-data-postgrest";

const dataProvider = postgrestRestProvider("http://localhost:3000/admin/api");

const AdminPage = () => (
  <Admin basename="/admin" dataProvider={dataProvider}>
    <Resource
        name="products"
        list={<ProductList />}
+        show={<ProductShow />}
    />
    <Resource name="categories" list={<CategoryList />} />
  </Admin>
);

const ProductList = () => (
    <List>
        <Datagrid>
        <TextField source="name" />
        <ReferenceField reference="categories" source="categoryId">
            <TextField source="name" />
        </ReferenceField>
        </Datagrid>
    </List>
);

+const ProductShow = () => (
+    <Show>
+        <SimpleShowLayout>
+        <TextField source="name" />
+        <ReferenceField reference="categories" source="categoryId">
+            <TextField source="name" />
+        </ReferenceField>
+        </SimpleShowLayout>
+    </Show>
+);

const CategoryList = () => (
    <List>
        <Datagrid>
        <TextField source="name" />
        </Datagrid>
    </List>
);

export default AdminPage;
```

[SCREENCAST]

Why? It's actually because of how Postgrest works by default. It returns arrays of records even though we're only interested by a single record. To circumvent that, `ra-data-postgrest` actually add some HTTP headers telling postgres to return a single record. However, I don't pass those headers in my API route. Let's fix that:

```diff
// In app/routes/admin/api/$.tsx
import { LoaderFunction } from '@remix-run/node';

export const loader: LoaderFunction = ({ request }) => {
    const apiUrl = getSupabaseUrlFromRequestUrl(request.url);

    return fetch(apiUrl, {
        headers: {
+            prefer: request.headers.get('prefer') ?? '',
+            accept: request.headers.get('accept') ?? 'application/json',
            apiKey: `${process.env.SUPABASE_SERVICE_ROLE}`,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`,
        }
    })
}

const ADMIN_PREFIX = '/admin/api';

const getSupabaseUrlFromRequestUrl = (url: string) => {
    const startOfRequest = url.indexOf(ADMIN_PREFIX);
    const query = url.substring(startOfRequest + ADMIN_PREFIX.length);
    return `${process.env.SUPABASE_URL}/rest/v1${query}`;
}
```

And now it works!
[SCREENCAST]

## Mutating data

Now that I have the reading part done, let's add the writing part. In Remix, mutations are handled by an [`action`](https://remix.run/docs/en/v1/guides/data-writes#remix-mutation-start-to-finish) function. This function receive the same parameters as the `loader` and in my case it will work almost exactly like it.

The only difference is that I'll also pass the request method and body.

```diff
// In app/routes/admin/api/$.tsx
-import { LoaderFunction } from '@remix-run/node';
+import { ActionFunction, LoaderFunction } from '@remix-run/node';

export const loader: LoaderFunction = ({ request }) => {
    const apiUrl = getSupabaseUrlFromRequestUrl(request.url);

    return fetch(apiUrl, {
        headers: {
            prefer: request.headers.get('prefer') ?? '',
            accept: request.headers.get('accept') ?? 'application/json',
            'apiKey': `${process.env.SUPABASE_SERVICE_ROLE}`,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`,
        }
    });
}

+export const action: ActionFunction = ({ request }) => {
+    const apiUrl = getSupabaseUrlFromRequestUrl(request.url);
+
+    return fetch(apiUrl, {
+        method: request.method,
+        body: request.body,
+        headers: {
+            prefer: request.headers.get('prefer') ?? '',
+            accept: request.headers.get('accept') ?? 'application/json',
+            'apiKey': `${process.env.SUPABASE_SERVICE_ROLE}`,
+            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`,
+        }
+    });
+}

const ADMIN_PREFIX = '/admin/api';

const getSupabaseUrlFromRequestUrl = (url: string) => {
    const startOfRequest = url.indexOf(ADMIN_PREFIX);
    const query = url.substring(startOfRequest + ADMIN_PREFIX.length);
    return `${process.env.SUPABASE_URL}/rest/v1${query}`;
}
```

I can now add some create and edit pages for my resources:

```diff
import {
  Admin,
+  AutocompleteInput,
+  Create,
  Datagrid,
+  Edit,
+  EditButton,
  List,
  ReferenceField,
+  ReferenceInput,
  Resource,
  Show,
  ShowButton,
+  SimpleForm,
  SimpleShowLayout,
+  TextField,
+  TextInput,
} from "react-admin";
import postgrestRestProvider from "@raphiniert/ra-data-postgrest";

const dataProvider = postgrestRestProvider("http://localhost:3000/admin/api");

const AdminPage = () => (
    <Admin basename="/admin" dataProvider={dataProvider}>
        <Resource
            name="products"
            list={<ProductList />}
            show={<ProductShow />}
+            edit={<ProductEdit />}
+            create={<ProductCreate />}
        />
        <Resource
            name="categories"
            list={<CategoryList />}
+            create={<CategoryCreate />}
+            edit={<CategoryEdit />}
        />
    </Admin>
);

const ProductList = () => (
    <List>
        <Datagrid>
        <TextField source="name" />
        <ReferenceField reference="categories" source="categoryId">
            <TextField source="name" />
        </ReferenceField>
        </Datagrid>
    </List>
);

+const ProductCreate = () => (
+  <Create>
+    <SimpleForm>
+      <TextInput source="name" />
+      <ReferenceInput reference="categories" source="categoryId">
+        <AutocompleteInput
+          source="name"
+          filterToQuery={(query) => ({ "name@ilike": query })}
+        />
+      </ReferenceInput>
+    </SimpleForm>
+  </Create>
+);
+
+const ProductEdit = () => (
+  <Edit>
+    <SimpleForm>
+      <TextInput source="name" />
+      <ReferenceInput reference="categories" source="categoryId">
+        <AutocompleteInput
+          source="name"
+          filterToQuery={(query) => ({ "name@ilike": query })}
+        />
+      </ReferenceInput>
+    </SimpleForm>
+  </Edit>
+);

const CategoryList = () => (
    <List>
        <Datagrid>
        <TextField source="name" />
        </Datagrid>
    </List>
);

+const CategoryCreate = () => (
+  <Create>
+    <SimpleForm>
+      <TextInput source="name" />
+    </SimpleForm>
+  </Create>
+);
+
+const CategoryEdit = () => (
+  <Edit>
+    <SimpleForm>
+      <TextInput source="name" />
+    </SimpleForm>
+  </Edit>
+);

export default AdminPage;
```

You may have spotted a small gotcha related to postgrest here. I had to provide the `filterToQuery` prop to the `AutocompleteInput` used to select a product category. Indeed, `ra-data-postgrest` does not support the default `q` filter so I used the `filterToQuery` prop to convert the query into something it understands. Here, I used `name@ilike` as the filter key to make a case insensitive search on the `name` field.

And that's it, we have a full blown API! However, it is currently accessible by everyone. Let's fix that!

## Authentication

- remix-auth
- careful with login payload (json, not formData)
