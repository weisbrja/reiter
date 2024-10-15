import { useState } from 'preact/hooks'
import { usePopupErrorContext } from '../components/Popup'
import DropdownSelect from '../components/DropdownSelect'

export interface Crawler {
	refId: string
	crawlerType: string
}

const crawlerTypes = ["kit-ilias-web", "ilias-web", 'local', '']

export default function AddCrawlerForm({ onSubmit }: { onSubmit: (crawler: Crawler) => void }) {
	const { setError, onCancel } = usePopupErrorContext()
	const [refId, setRefId] = useState('')
	const [crawlerType, setCrawlerType] = useState()

	function handleSubmit(e: Event) {
		e.preventDefault()
		if (!refId) {
			setError('Ref_ID is required')
			return
		}

		if (!crawlerType) {
			setError('Crawler type is required')
			return
		}
		const crawler: Crawler = {
			refId,
			crawlerType,
		}
		onSubmit(crawler)
	}
	return (
		<form>
			<div class="form-control mb-4">
				<div class="label">
					<label class="label-text">Ref_ID</label>
				</div>
				<input
					type="text"
					id="crawler"
					value={refId}
					onInput={(e) => setRefId((e.target as HTMLInputElement).value)}
					class="input input-bordered"
					placeholder="Ref_ID"
				/>
				<div class="label">
					<label class="label-text">Crawler</label>
				</div>
				<DropdownSelect onSelect={() => setCrawlerType}>{crawlerTypes}</DropdownSelect>
				<div class="flex justify-end md-4">
					<button type="button" onClick={onCancel} class="btn btn-error mr-4">
						Cancel
					</button>
					<button type="submit" class="btn btn-primary" onClick={handleSubmit}>
						Add Crawler
					</button>
				</div>
			</div>
		</form>
	)
}
