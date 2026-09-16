import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PatientsService } from '../patients/patients.service';
import { BillsService } from '../bills/bills.service';

@UseGuards(JwtAuthGuard)
@Controller('api/dashboard')
export class DashboardController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly billsService: BillsService,
  ) {}

  @Get('summary')
  async summary() {
    const [totalPatients, recentPatients, billSummary] = await Promise.all([
      this.patientsService.countAll(),
      this.patientsService.recentlyAdded(5),
      this.billsService.summary(),
    ]);

    return {
      totalPatients,
      recentPatients,
      totalBills: billSummary.totalBills,
      totalPaid: billSummary.totalPaid,
      totalPending: billSummary.totalPending,
    };
  }
}
