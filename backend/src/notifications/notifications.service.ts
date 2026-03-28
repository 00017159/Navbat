import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // Example listener for new appointment bookings
  @OnEvent('appointment.created')
  handleAppointmentCreatedEvent(payload: any) {
    this.logger.log(
      `New appointment created for Patient ${payload.patientId} with Doctor ${payload.doctorId}`,
    );
    // Simulate push notification logic to external services here
  }
}
