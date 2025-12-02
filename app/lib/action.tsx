'use server';

import {z} from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const FormSchema = z.object({
        id: z.string(),
        customerId: z.string({
            invalid_type_error: 'Please select a customer.',
        }),
        amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
        status: z.enum(['pending', 'paid'], {
            invalid_type_error: 'Please select an invoice status.',
        }),
        date: z.string()
    })

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
    message: string | null;
    errors: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
}

export async function createInvoice(prevState: State, formdata: FormData) {
    
    const validateFields = CreateInvoice.safeParse({
        customerId: formdata.get('customerId'),
        amount: formdata.get('amount'),
        status: formdata.get('status')
    });
    if(!validateFields.success){
        const fieldErrors = validateFields.error.flatten().fieldErrors;
        return {
            message: 'There were errors with your submission.',
            errors: fieldErrors,
        }
    }
    const {customerId, amount, status} = validateFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    try{
         await sql`
            INSERT INTO invoices (customer_id, amount, status, date)
            VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
    }catch (error) {
        console.log(error);
        return {
            message: 'Error creating invoice',
        }
    }
      

    revalidatePath('/dashboard/invoices'); // /dashboard/invoices路径将被重新验证，并从服务器获取最新数据。
    redirect('/dashboard/invoices'); // 重定向到发票列表页面
}

export async function updateInvoice(id: string, prevState: State,formdata: FormData) {
    const validateFields = UpdateInvoice.safeParse({
        customerId: formdata.get('customerId'),
        amount: formdata.get('amount'),
        status: formdata.get('status')
    });
    if(!validateFields.success){
        const fieldErrors = validateFields.error.flatten().fieldErrors;
        return {
            message: 'There were errors with your submission.',
            errors: fieldErrors,
        }
    }
    const {customerId, amount, status} = validateFields.data;
    const amountInCents = amount * 100;

    try {
        await sql`
            UPDATE invoices
            SET customer_id = ${customerId},
                amount = ${amountInCents},
                status = ${status}
            WHERE id = ${id}
        `;
    } catch (error) {
        console.log(error);
       return {
            message: 'Error updating invoice',
        }
    }
    

    revalidatePath('/dashboard/invoices'); // /dashboard/invoices路径将被重新验证，并从服务器获取最新数据。
    redirect('/dashboard/invoices'); // 重定向到发票列表页面
}
export async function deleteInvoice(id: string) {
    throw new Error('Failed to Delete Invoice');
    await sql`
            DELETE FROM invoices
            WHERE id = ${id}
        `; 
    
    revalidatePath('/dashboard/invoices'); // /dashboard/invoices路径将被重新验证，并从服务器获取最新数据。
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}