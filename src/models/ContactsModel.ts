import { model, Schema } from 'mongoose';

export type TContactsProps = {
    firstName: string;
    lastName: string;
    message: string;
    phone: string;
    email: string;
    isReply: boolean
};

const ContactsSchema = new Schema<TContactsProps>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    message: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, trim: true },
    isReply: { type: Boolean, default: false }
}, { timestamps: true });

const ContactsModel = model<TContactsProps>('Contacts', ContactsSchema);
export default ContactsModel;