import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BackendOrderStatus, Order } from '../../../../core/models';
import { environment } from '../../../../../environments/environment';
import { ToastService } from '../../../../shared/components/toast';
import { AuthService } from '../../../../core/services/auth-service';
import { CartService } from '../../../../core/services/cart-service';
import { ApiService } from '../../../../core/services/api-service';

declare var Razorpay: any;

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private api = inject(ApiService);
  readonly cart = inject(CartService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  currentStep = signal(1);
  paymentMethod = signal<'Online' | 'COD'>('Online');
  placing = signal(false);
  placedOrderId = signal<string>('');
  addrType = signal('Home');
  state: any = {};

  steps = [
    { no: 1, label: 'Address' },
    { no: 2, label: 'Payment' },
    { no: 3, label: 'Confirm' },
  ];

  addressTypes = [
    { value: 'Home', icon: '🏠', label: 'Home' },
    { value: 'Work', icon: '💼', label: 'Work' },
    { value: 'Other', icon: '📍', label: 'Other' },
  ];

  onlinePayMethods = [
    { icon: '📱', label: 'UPI' },
    { icon: '💳', label: 'Credit Card' },
    { icon: '🏦', label: 'Debit Card' },
    { icon: '🌐', label: 'Net Banking' },
  ];

  addressForm = this.fb.group({
    name: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    line1: ['', Validators.required],
    line2: [''],
    city: ['', Validators.required],
    state: ['', Validators.required],
    pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  get af() {
    return this.addressForm.controls;
  }

  ngOnInit() {
    // Prefill from user profile
    const user = this.auth.user();
    if (user) {
      this.addressForm.patchValue({ name: `${user.firstName} ${user.lastName ?? ''}`.trim() });
    }
    // Get cart summary state passed from cart page
    const nav = this.router.lastSuccessfulNavigation?.extras?.state;
    if (nav) this.state = nav;
  }

  nextStep() {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }
    this.currentStep.set(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  placeOrder() {
    if (this.paymentMethod() === 'Online') {
      this.initiateRazorpay();
    } else {
      this.createOrder(null);
    }
  }

  // private initiateRazorpay() {
  //   this.placing.set(true);
  //   // Create Razorpay order via API
  //   this.api
  //     .post<{
  //       razorpayOrderId: string;
  //       amount: number;
  //       currency: string;
  //     }>('/payment/initiate', { amount: this.state.grandTotal, currency: 'INR' })
  //     .subscribe({
  //       next: (res) => {
  //         const opts = {
  //           key: environment.razorpayKey,
  //           amount: res.data.amount * 100,
  //           currency: res.data.currency,
  //           name: 'Swadify',
  //           description: 'Food Order Payment',
  //           order_id: res.data.razorpayOrderId,
  //           image: '/assets/logo.svg',
  //           prefill: {
  //             name: this.addressForm.value.name,
  //             contact: this.addressForm.value.phone,
  //             email: this.auth.user()?.email,
  //           },
  //           theme: { color: '#D94F3D' },
  //           handler: (response: any) => this.createOrder(response),
  //           modal: { ondismiss: () => this.placing.set(false) },
  //         };
  //         const rzp = new Razorpay(opts);
  //         rzp.open();
  //         this.placing.set(false);
  //       },
  //       error: () => {
  //         this.placing.set(false);
  //         this.toast.error('Payment initiation failed. Please try again.');
  //       },
  //     });
  // }

  private initiateRazorpay() {
    this.placing.set(true);

    this.api
      .post<{
        razorpayOrderId: string;
        amount: number;
        currency: string;
      }>('/payment/initiate', {
        amount: this.state.grandTotal,
        currency: 'INR',
      })
      .subscribe({
        next: (res) => {
          const opts = {
            key: environment.razorpayKey,

            amount: res.data.amount * 100,

            currency: res.data.currency,

            name: 'Swadify',

            description: 'Food Order Payment',

            order_id: res.data.razorpayOrderId,

            image: '/assets/logo.svg',

            prefill: {
              name: this.addressForm.value.name,
              contact: this.addressForm.value.phone,
              email: this.auth.user()?.email,
            },

            theme: {
              color: '#D94F3D',
            },

            handler: (response: any) => {
              this.verifyPaymentAndCreateOrder(response);
            },

            modal: {
              ondismiss: () => {
                this.placing.set(false);
              },
            },
          };

          const rzp = new Razorpay(opts);

          rzp.open();

          this.placing.set(false);
        },

        error: () => {
          this.placing.set(false);

          this.toast.error('Payment initiation failed. Please try again.');
        },
      });
  }

  private verifyPaymentAndCreateOrder(paymentResponse: any) {
    this.api
      .post('/payment/verify', {
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
      })
      .subscribe({
        next: () => {
          this.createOrder(paymentResponse);
        },

        error: () => {
          this.placing.set(false);

          this.toast.error('Payment verification failed');
        },
      });
  }

  // private createOrder(paymentResponse: any) {
  //   this.placing.set(true);
  //   const addr = this.addressForm.value;
  //   const payload = {
  //     restaurantId: Number(this.cart.cart()?.restaurantId),
  //     paymentMethod: this.paymentMethod() === 'COD' ? 1 : 2, // match your PaymentMethod enum
  //     items: this.cart.items().map((i) => ({
  //       menuItemId: Number(i.menuItem.id),
  //       quantity: i.quantity,
  //     })),
  //     deliveryAddressLine1: addr.line1,
  //     deliveryAddressLine2: addr.line2 ?? '',
  //     deliveryCity: addr.city,
  //     deliveryState: addr.state,
  //     deliveryPinCode: addr.pincode,
  //     deliveryLatitude: 0,
  //     deliveryLongitude: 0,
  //     specialInstructions: this.state.instructions ?? '',
  //     initialStatus: BackendOrderStatus.Received,
  //     promoCode: this.state.promoCode ?? '',
  //     razorpayPaymentId: paymentResponse?.razorpay_payment_id,
  //     razorpayOrderId: paymentResponse?.razorpay_order_id,
  //     razorpaySignature: paymentResponse?.razorpay_signature,
  //   };
  //   this.api.post<Order>('/order', payload).subscribe({
  //     next: (res) => {
  //       this.placedOrderId.set(res.data.id);
  //       this.cart.clear();
  //       this.currentStep.set(3);
  //       this.placing.set(false);
  //       window.scrollTo({ top: 0, behavior: 'smooth' });
  //     },
  //     error: () => {
  //       this.placing.set(false);
  //       this.toast.error('Order placement failed. Please try again.');
  //     },
  //   });
  // }
  private createOrder(paymentResponse: any) {
    this.placing.set(true);

    const addr = this.addressForm.value;

    const payload = {
      restaurantId: Number(this.cart.cart()?.restaurantId),

      paymentMethod: this.paymentMethod() === 'COD' ? 1 : 2,

      items: this.cart.items().map((i) => ({
        menuItemId: Number(i.menuItem.id),
        quantity: i.quantity,
      })),

      deliveryAddressLine1: addr.line1,

      deliveryAddressLine2: addr.line2 ?? '',

      deliveryCity: addr.city,

      deliveryState: addr.state,

      deliveryPinCode: addr.pincode,

      deliveryLatitude: 0,

      deliveryLongitude: 0,

      specialInstructions: this.state.instructions ?? '',

      razorpayPaymentId: paymentResponse?.razorpay_payment_id,

      razorpayOrderId: paymentResponse?.razorpay_order_id,

      razorpaySignature: paymentResponse?.razorpay_signature,
    };

    this.api.post<Order>('/order', payload).subscribe({
      next: (res) => {
        this.placedOrderId.set(res.data.id);

        this.cart.clear();

        this.currentStep.set(3);

        this.placing.set(false);

        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      },

      error: () => {
        this.placing.set(false);

        this.toast.error('Order placement failed. Please try again.');
      },
    });
  }
}
